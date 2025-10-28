import { Processor, WorkerHost } from '@nestjs/bullmq';
import { AccountsQueue } from '../constants/app.constants';
import { Inject, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { AccountsService } from '../accounts/accounts.service';
import { Job } from 'bullmq';
import { NewAccountRequestJobData } from './account-events.type';
import { RegistrationService } from '../registration/registration.service';
import { AccountUsersService } from '../account-users/account-users.service';
import { AccountCreationDto } from '../accounts/dtos/accounts.dto';
import { AccountStatus } from '../accounts/types/account.types';
import { AuditEventType, AuditSubject } from '../audit/audit-event-type.enum';
import { CreateAccountUserDto } from '../account-users/dtos';
import { ApplicationModule, ApplicationRole } from '../account-users/schemas';

@Processor(AccountsQueue.NEW_ACCOUNT_QUEUE)
export class NewAccountsProcessor extends WorkerHost {
  private readonly logger = new Logger(NewAccountsProcessor.name);

  constructor(
    @Inject()
    private readonly auditService: AuditService,
    @Inject()
    private readonly registrationService: RegistrationService,
    @Inject()
    private readonly accountService: AccountsService,
    @Inject()
    private readonly accountUsersService: AccountUsersService,
  ) {
    super();
  }

  async process(job: Job<NewAccountRequestJobData>): Promise<void> {
    const { registrationId } = job.data;

    this.logger.log({
      message: `Processing job ${job.id} for event ${job.name}`,
      data: job.data,
    });
    // get the registration details
    try {
      const registrationDetails =
        await this.registrationService.getRegistrationDetails(registrationId);

      if (!registrationDetails) {
        this.logger.error(
          `Registration Details not found for registrationID ${registrationId}`,
        );
        throw new Error(
          `Registration Details not found for registrationID ${registrationId}`,
        );
      }

      // Create the account details
      const accountCreation: AccountCreationDto = {
        accountName: registrationDetails.company.name,
        company: {
          name: registrationDetails.company.name,
          address: {
            street: registrationDetails.company.address.street,
            city: registrationDetails.company.address.city,
            state: registrationDetails.company.address.state,
            country: registrationDetails.company.address.country,
            postalCode: registrationDetails.company.address.postalCode,
          },
          website: registrationDetails.company.website,
        },
        status: AccountStatus.ACTIVE,
        walletAddress: registrationDetails.company.accountWalletAddress,
        contact: {
          name: registrationDetails.contact.name,
          emailAddress: registrationDetails.contact.email,
          phone: registrationDetails.contact.phone,
          position: registrationDetails.contact.position,
        },
        applicationModules: [
          ApplicationModule.PAPERLESS_TRADE_DOCUMENTS,
          ApplicationModule.PAPERLESS_ADMIN,
          ApplicationModule.PAPERLESS_TRADE_FINANCE,
        ],
      };
      const newAccountDetails =
        await this.accountService.createAccount(accountCreation);

      // Create the default account
      const defaultUser: CreateAccountUserDto = {
        accountId: newAccountDetails.id,
        name: registrationDetails.contact.name,
        emailAddress: registrationDetails.contact.email,
        walletAddress: registrationDetails.company.accountWalletAddress,
        permissions: [
          {
            module: ApplicationModule.PAPERLESS_ADMIN,
            role: ApplicationRole.MANAGER,
          },
          {
            module: ApplicationModule.PAPERLESS_ADMIN,
            role: ApplicationRole.AGENT,
          },
          {
            module: ApplicationModule.PAPERLESS_ADMIN,
            role: ApplicationRole.SUPERVISOR,
          },
        ],
      };
      await this.accountUsersService.createAccountUser(defaultUser);

      await this.auditService.log({
        subject: AuditSubject.ONBOARDING,
        eventType: AuditEventType.CREATED,
        identifier: registrationId,
        accountId: newAccountDetails.id,
        details: { registrationId },
      });
    } catch (error) {
      // ToDo: Need to handle failures and roll back transactions
      //  So either replace with a flow or track the created data outside the try/catch and delete as needed
      this.logger.error({
        message: 'Processing of New Account Creation failed',
        error,
      });
      throw error;
    }
  }
}
