import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import {
  DataExtractionResponse,
  GraipDataExtractionCallBackJob,
} from './data-extraction.types';
import { InjectQueue } from '@nestjs/bullmq';
import {
  DATA_EXTRACTION_GRAIP_CALLBACK_EVENT,
  DATA_EXTRACTION_QUEUE_NAME,
} from '../constants/app.constants';
import { Queue } from 'bullmq';
import {
  BillableItem,
  BillOfExchangeContent,
  InvoiceContent,
  OtherDocumentContent,
  PromissoryNoteContent, TradeDocumentType,
} from '../types/trade-documents.types';
import { GraipDataExtractionSubmitResponse } from './types/graip.types';
import { TradeDocumentFileDTO } from '../trade-documents/dtos/trade-document-file.dto';
import { FILE_STORAGE_SERVICE } from '../file-storage/file-storage.constants';
import { FileStorageService } from '../file-storage/file-storage.interface';

@Injectable()
export class DataExtractionService {
  private readonly logger = new Logger(DataExtractionService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectQueue(DATA_EXTRACTION_QUEUE_NAME)
    private readonly dataExtractionCallbackQueue: Queue,
    @Inject(FILE_STORAGE_SERVICE)
    private readonly fileStorageService: FileStorageService
  ) {}

  private getFlowId(documentType: string): string {
    if (!documentType) return '';
    switch (documentType.toLowerCase()) {
      case 'invoice':
        return this.configService.get<string>('GRAIP_INVOICE_FLOW_ID');
      case 'promissory note':
        return this.configService.get<string>('GRAIP_PROMISSORY_NOTE_FLOW_ID');
      case 'bill of exchange':
        return this.configService.get<string>('GRAIP_BILL_OF_EXCHANGE_FLOW_ID');
      default:
        return '';
    }
  }

  private async getBlobFromDataUrl(dataUrl: string): Promise<Blob> {
    // Convert data URL to Blob
    const response = await fetch(dataUrl);
    return await response.blob();
  }

  private async sendToGraip(
    flowId: string,
    documentTitle: string,
    dataUrl: string,
  ): Promise<DataExtractionResponse> {
    const formData = new FormData();
    formData.append('title', documentTitle);
    formData.append(
      'file',
      await this.getBlobFromDataUrl(dataUrl),
      documentTitle,
    );
    this.logger.debug({
      message: 'Sending to GRAIP',
      flowId,
      documentTitle,
      dataUrl,
    });

    const graipClient = axios.create({
      baseURL: this.configService.get<string>('GRAIP_BASE_URL'),
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.configService.get<string>('GRAIP_API_KEY'),
      },
    });

    const response = await graipClient.post<GraipDataExtractionSubmitResponse>(
      `/v1/${flowId}/request`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );


    if (response.status === 201) {
      this.logger.debug({graipPostResponseData: response.data})
      const requestId = response.data.id;
      return { success: true, requestId };
    } else {
      return {
        success: false,
        message: `Failed to retrieve version information: HTTP ${response.status} received: ${response.data}`,
      };
    }
  }

  async sendForDataExtraction(
    documentType: string,
    documentTitle: string,
    accountId: string,
    documentId: string,
    tradeDocumentFile:  TradeDocumentFileDTO,
  ): Promise<DataExtractionResponse> {
    const flowId = this.getFlowId(documentType);
    if (flowId.length === 0) {
      this.logger.error({
        message:
          'Unable to send request to GRAIP for data extraction. The document type does not have an associated FlowId',
        documentType,
        accountId,
        documentId,
      });
      return;
    }

    const file = await this.fileStorageService.downloadFile(tradeDocumentFile.storedFileName);
    const base64String = file.toString("base64")
    const dataUrl = `data:${tradeDocumentFile.mimeType};base64,${base64String}`;

    const response = await this.sendToGraip(flowId, documentTitle, dataUrl);
    if (response.success) {
      // Successful so add callback information to queue
      const jobDetails: GraipDataExtractionCallBackJob = {
        accountId,
        documentId,
        documentType,
        flowId,
        requestId: response.requestId,
      };
      return await this.addToGraipCallbackQueue(jobDetails);
    } else {
      this.logger.error({
        message: 'Failed to send document to Graip',
        accountId,
        documentId,
        flowId,
        documentType,
      });
      throw new Error('Failed to send document to Graip');
    }
  }

  private async addToGraipCallbackQueue(
    jobDetails: GraipDataExtractionCallBackJob,
  ) {
    try {
      await this.dataExtractionCallbackQueue.add(
        DATA_EXTRACTION_GRAIP_CALLBACK_EVENT,
        jobDetails,
      );
      this.logger.debug({
        message: 'Added to Graip Data Extraction Callback Queue',
        jobDetails,
      });
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error({
        message: 'Failed to submit Trade Document for data extraction',
        error: error.message,
      });
      return {
        success: false,
        message: `Failed to add Callback to GRAIP Callback queue. Error: ${error.message}}`,
      };
    }
  }

  private async checkGraipForData(
    flowId: string,
    requestId: string,
  ): Promise<DataExtractionResponse> {
    const graipClient = axios.create({
      baseURL: this.configService.get<string>('GRAIP_BASE_URL'),
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.configService.get<string>('GRAIP_API_KEY'),
      },
    });

    return await graipClient
      .get<AxiosResponse>(`/v1/${flowId}/request/${requestId}/export/json`)
      .then((response: AxiosResponse) => {
        if (response.status === 200) {
          return {
            success: true,
            documentContent: response.data,
          } as DataExtractionResponse;
        } else {
          return { success: false } as DataExtractionResponse;
        }
      })
      .catch((error: Error) => {
        this.logger.warn({
          msg: 'Call to Graip API failed',
          url: `/v1/${flowId}/request/${requestId}/export/json`,
          error: error.message,
        });
        return { success: false } as DataExtractionResponse;
      });
  }

  // Todo: Create a Type for the Graip Response Data
  private mapGraipDataToInvoiceContent(graipInvoiceData: any) {
    const sourceDataFields = graipInvoiceData.headers;
    const billableItems = graipInvoiceData.tables.length > 0 ? graipInvoiceData.tables[0].rows : []


    const extractedData: InvoiceContent = {
      invoiceNumber: sourceDataFields.InvoiceId ? sourceDataFields.InvoiceId: "",
      billFrom: {
        companyName: sourceDataFields.VendorName ? sourceDataFields.VendorName: "",
        streetAddress: sourceDataFields.VendorAddress ? sourceDataFields.VendorAddress: "",
        city: "",
        postalCode: "",
        contactNumber: "",
        contactEmail: ""
      },
      billTo: {
        companyName: sourceDataFields.CustomerCompanyName ? sourceDataFields.CustomerCompanyName: "",
        streetAddress: sourceDataFields.CustomerAddress ? sourceDataFields.CustomerAddress: "",
        city: "",
        postalCode: "",
        contactNumber: "",
        contactEmail: ""
      },
      invoiceDate: sourceDataFields.InvoiceDate ? sourceDataFields.InvoiceDate.substring(0,10) : "",
      dueDate: sourceDataFields.DueDate ? sourceDataFields.DueDate.substring(0,10) : "",
      subTotal: sourceDataFields.SubTotal ? parseCurrencyToFloat(sourceDataFields.SubTotal): 0.00,
      tax: sourceDataFields.TotalTax ? parseCurrencyToFloat(sourceDataFields.TotalTax): 0.0,
      total: sourceDataFields.InvoiceTotal ? parseCurrencyToFloat(sourceDataFields.InvoiceTotal): 0.0,
      terms: "",
      currencyCode: sourceDataFields.CurrencyCode ? sourceDataFields.CurrencyCode: "",
      billableItems: billableItems.map((item) => {
        return {
          description: item.Description ? item.Description : "",
          amount: item.Amount ? parseCurrencyToFloat(item.Amount) : 0.0,
          unitPrice: item["Unit price"] ? parseCurrencyToFloat(item["Unit price"]) : 0.0,
          quantity: item.Quantity ? parseCurrencyToFloat(item.Quantity.trim()) : 0,
        } as BillableItem
      })


    }
    return extractedData;
  }
  
  private mapData(
    documentType: string,
    data: any,
  ):
    { invoiceContent?: InvoiceContent,
    billOfExchangeContent?: BillOfExchangeContent,
    promissoryNoteContent?: PromissoryNoteContent,
    otherDocumentContent?: OtherDocumentContent}{
    
    switch (documentType.toLowerCase()) {
      case TradeDocumentType.INVOICE.toLowerCase():
        return {invoiceContent: this.mapGraipDataToInvoiceContent(data)};
      case TradeDocumentType.BILL_OF_EXCHANGE.toLowerCase():
      case TradeDocumentType.PROMISSORY_NOTE.toLowerCase():
      case TradeDocumentType.OTHER.toLowerCase():
        return { };
      default:
        return {};
        
    }
  }

  async checkExtractionCallback(
    jobDetails: GraipDataExtractionCallBackJob,
  ): Promise<DataExtractionResponse> {
    this.logger.debug({ message: 'Checking Extraction Callback', jobDetails });
    const { documentType, flowId, requestId } =
      jobDetails;
    const results = await this.checkGraipForData(flowId, requestId);

    if (results.success) {
      // Extraction complete so extract data and map to type
      return {
        success: true,
       ...this.mapData(documentType, results.documentContent),
      };

      // Todo: Store the extracted data so that we can use this for Due Diligence checks and better training for models
    } else {
      return {
        success: false,
        message: 'Graip Data Extraction not yet complete',
      };
    }
  }
}
