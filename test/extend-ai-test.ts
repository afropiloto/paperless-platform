import {ExtendClient} from 'extend-ai'

const client = new ExtendClient({token: "sk_test_b1zEL_vhWQN_XH9kgEE7z"})


function createProcessor() {
  // Create the Invoice Processor
  client.processor
    .create({
      name: 'Basic Invoice Processor',
      type: 'EXTRACT',
      config: {
        type: 'EXTRACT',
        schema: {
          type: 'object',
          properties: {
            invoice_number: {
              type: ['string', 'null'],
              description: 'The invoice number from the document',
            },
            invoice_date: {
              type: ['string', 'null'],
              description: 'The invoice date from the document',
            },
            due_date: {
              type: ['string', 'null'],
              description: 'The invoice due date from the document',
            },
            line_items: {
              type: 'array',
              description: 'Table of items from the invoice',
              items: {
                type: 'object',
                properties: {
                  item_name: {
                    type: ['string', 'null'],
                    description: 'Name of item',
                  },
                  quantity: {
                    type: ['number', 'null'],
                    description: 'Quantity in units',
                  },
                  subtotal: {
                    type: ['number', 'null'],
                    description: 'Subtotal for the item',
                  },
                },
                required: [
                  'item_name',
                  'price_per_unit',
                  'quantity',
                  'subtotal',
                ],
              },
            },
          },
          required: ['invoice_number', 'invoice_date', 'line_items'],
        },
      },
    })
    .then((response) => {
      console.log(`Processor creation response: ${JSON.stringify(response)}`);
    });
}

function runProcessor(fileUrl: string) {
  return client.processorRun.create({
    processorId: "dp_RGMSIngSpEDMETtKhdzTH",
    file: {
      fileName: "invoice_example.pdf",
      fileUrl: fileUrl
    }

  }).then((response) => {
    console.log(`Processor creation response: ${JSON.stringify(response)}`);
    const processorRunId = response.processorRun.id;
    console.log(processorRunId)
    return processorRunId;

  })
}

function getUpdate(runId: string){
  client.processorRun.get(runId) // Replace with actual processorRun ID
    .then(response => {
      console.log("Processor run details:", JSON.stringify(response, null, 2));
      return
    });


}


// createProcessor();
// runProcessor("https://drive.google.com/file/d/1cvm7qptXpf_zJmwEnhhbDpd_K_ycFOGq/view?usp=sharing")
//   .then((runId: string) => {
//     getUpdate(runId)
//   })


getUpdate("dpr_Uml20GN1fHDCvrbb-DGeN")