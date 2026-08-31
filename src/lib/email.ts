import { Resend } from "resend";

/**
 * Initialise Resend uniquement au moment de l'appel
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing.");
  }

  return new Resend(apiKey);
}

/**
 * Vérifie les variables nécessaires
 */
function getEmailConfig() {
  const from = process.env.RESEND_FROM;
  const baseUrl = process.env.APP_BASE_URL;

  if (!from) {
    throw new Error("RESEND_FROM is missing.");
  }

  if (!baseUrl) {
    throw new Error("APP_BASE_URL is missing.");
  }

  return { from, baseUrl };
}

type EngagementRequestEmailParams = {
  requestId: number;
  reviewToken: string;
  requesterName: string;
  requesterEmail: string;
  clientName: string;
  engagementSubject: string;
  departmentName: string;
  contractDate: string;
  signatoryName: string;
};

function baseEmailLayout(title: string, content: string) {
  return `
    <div style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" style="background-color:#f3f6fb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table width="100%" style="max-width:700px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
              
              <tr>
                <td style="background:linear-gradient(135deg,#0b245b 0%,#2563eb 100%);padding:28px 32px;">
                  <div style="font-size:14px;letter-spacing:2px;color:#c7d2fe;text-transform:uppercase;font-weight:bold;">
                    BDO DRC
                  </div>
                  <div style="margin-top:8px;font-size:30px;color:#ffffff;font-weight:800;">
                    ${title}
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding:32px;">
                  ${content}
                </td>
              </tr>

              <tr>
                <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                  <div style="font-size:12px;color:#64748b;">
                    Cet e-mail a été généré automatiquement par le portail BDO DRC.
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

function detailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;width:220px;">
        <strong>${label}</strong>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
        ${value}
      </td>
    </tr>
  `;
}

function formatRequestDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Kinshasa",
  }).format(new Date(value));
}

export async function sendRiskReviewRequestEmail(
  params: EngagementRequestEmailParams
) {
  const resend = getResendClient();
  const { from, baseUrl } = getEmailConfig();

  const reviewUrl = `${baseUrl}/engagement/request/review/${params.reviewToken}`;

  const subject = `Validation requise - ${params.clientName}`;

  const html = baseEmailLayout(
    "Demande de validation",
    `
    <p>Une nouvelle demande nécessite validation :</p>

    <table>
      ${detailRow("Demandeur", params.requesterName)}
      ${detailRow("Client", params.clientName)}
      ${detailRow("Objectif de la mission", params.engagementSubject)}
      ${detailRow("Département", params.departmentName)}
      ${detailRow("Date du contrat", params.contractDate)}
      ${detailRow("Signataire", params.signatoryName)}
    </table>

    <br/>

    <a href="${reviewUrl}" style="background:#2563eb;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;">
      Ouvrir la demande
    </a>
    `
  );

  const { error } = await resend.emails.send({
    from,
    to: [
      "sarman.ilunga@bdo-ea.com",
      "brakini.biavanga@bdo-ea.com",
    ],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendApprovalEmail(params: {
  requesterEmail: string;
  requesterName: string;
  referenceNumber: string;
  clientName: string;
  engagementSubject: string;
  requestedAt: string;
}) {
  const resend = getResendClient();
  const { from } = getEmailConfig();

  const html = baseEmailLayout(
    "Demande approuvée",
    `
    <p>Bonjour ${params.requesterName},</p>

    <p>Votre demande de numéro de référence a été approuvée par la Team Risk.</p>
    <table width="100%" style="border-collapse:collapse;margin:24px 0;">
      ${detailRow("Client", params.clientName)}
      ${detailRow("Objectif de la mission", params.engagementSubject)}
      ${detailRow("Date de la demande", formatRequestDate(params.requestedAt))}
      ${detailRow("Numéro de référence", params.referenceNumber)}
    </table>
    `
  );

  await resend.emails.send({
    from,
    to: [params.requesterEmail],
    subject: `Référence approuvée - ${params.clientName} - ${params.referenceNumber}`,
    html,
  });
}

export async function sendRejectionEmail(params: {
  requesterEmail: string;
  requesterName: string;
  rejectionReason: string;
  clientName: string;
  engagementSubject: string;
  requestedAt: string;
}) {
  const resend = getResendClient();
  const { from } = getEmailConfig();

  const html = baseEmailLayout(
    "Demande refusée",
    `
    <p>Bonjour ${params.requesterName},</p>

    <p>Votre demande de numéro de référence a été refusée par la Team Risk.</p>
    <table width="100%" style="border-collapse:collapse;margin:24px 0;">
      ${detailRow("Client", params.clientName)}
      ${detailRow("Objectif de la mission", params.engagementSubject)}
      ${detailRow("Date de la demande", formatRequestDate(params.requestedAt))}
      ${detailRow("Motif du refus", params.rejectionReason)}
    </table>
    `
  );

  await resend.emails.send({
    from,
    to: [params.requesterEmail],
    subject: `Demande refusée - ${params.clientName} - ${params.engagementSubject}`,
    html,
  });
}