import {
  CREATE_DOCUMENT_SIGNING_EVENT,
  CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
  CREATE_DOCUMENT_SIGNING_FINALISE_EVENT,
  CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT,
  CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT,
  FINALISE_ISSUE_QUEUE,
  ISSUED_FILE_QUEUE,
  MINT_DOCUMENT_QUEUE,
  TRADE_DOCUMENT_QUEUE,
  TT_FILE_QUEUE,
} from '../../constants/app.constants';
import { CreateDocumentSigningEventJobData } from '../../document-signing/types/signing-events.types';

export interface IssueJobData {
  accountId: string;
  documentId: string;
  isTransferrable?: boolean;
  issueDate?: Date;
  documentTrackingId?: string;
  documentReference?: string;
}

export interface IssueDealPromissoryNoteData extends IssueJobData {
  dealProcessingId: string;
}

const defaulOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
};

function getIssueTradeDocumentFlowSteps(jobData: IssueJobData) {
  return [
    {
      name: 'finalise-issue',
      queueName: FINALISE_ISSUE_QUEUE,
      data: jobData,
      opts: defaulOptions,
      children: [
        {
          name: 'mint-document',
          queueName: MINT_DOCUMENT_QUEUE,
          data: jobData,
          opts: defaulOptions,
          children: [
            {
              name: 'produce-tt-file',
              queueName: TT_FILE_QUEUE,
              data: jobData,
              opts: defaulOptions,
              children: [
                {
                  name: 'produce-issued-file',
                  queueName: ISSUED_FILE_QUEUE,
                  data: jobData,
                  opts: defaulOptions,
                },
              ],
            },
          ],
        },
      ],
    },
  ];
}

export function getIssueTradeDocumentEventFlow(jobData: IssueJobData) {
  return {
    name: 'issue-trade-document',
    queueName: TRADE_DOCUMENT_QUEUE,
    data: jobData,
    children: getIssueTradeDocumentFlowSteps(jobData),
  };
}

export function getCreateMultiSignEventFlow(signingEventCreationJobData: CreateDocumentSigningEventJobData) {
  return {

    name: CREATE_DOCUMENT_SIGNING_FINALISE_EVENT,
    queueName: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
    data: signingEventCreationJobData,
    opts: defaulOptions,
    children: [
      {
        name: CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT,
        queueName: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
        data: signingEventCreationJobData,
        opts: defaulOptions,
        children: [
          {
            name: CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT,
            queueName: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
            data: signingEventCreationJobData,
            opts: defaulOptions
          }
        ]
      }
    ]
  }
}

export function getIssueMultiSignTradeDocumentEventFlow(issueJobData: IssueJobData, signingEventCreationJobData: CreateDocumentSigningEventJobData) {
  return {
    name: CREATE_DOCUMENT_SIGNING_FINALISE_EVENT,
    queueName: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
    data: signingEventCreationJobData,
    opts: defaulOptions,
    children: [
      {
        name: CREATE_DOCUMENT_SIGNING_ON_CHAIN_EVENT,
        queueName: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
        data: signingEventCreationJobData,
        opts: defaulOptions,
        children: [
          {
            name: CREATE_DOCUMENT_SIGNING_OFF_CHAIN_EVENT,
            queueName: CREATE_DOCUMENT_SIGNING_EVENT_QUEUE,
            data: signingEventCreationJobData,
            opts: defaulOptions,
            children: getIssueTradeDocumentFlowSteps(issueJobData)
          }
        ]
      }
    ]
  }
}
