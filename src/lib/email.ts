import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const RESEND_FROM = process.env.RESEND_FROM!;
const APP_BASE_URL = process.env.APP_BASE_URL!;

type EngagementRequestEmailParams = {
  requestId: number;
  reviewToken: string;
  requesterName: string;
  requesterEmail: string;
  clientName: string;
  departmentName: string;
  contractDate: string;
  signatoryName: string;
};

function baseEmailLayout(title: string, content: string) {
  return `
    <div style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f6fb;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
              
              <tr>
                <td style="background:linear-gradient(135deg,#0b245b 0%,#2563eb 100%);padding:28px 32px;">
                  <div style="font-size:14px;letter-spacing:2px;color:#c7d2fe;text-transform:uppercase;font-weight:bold;">
                    BDO DRC
                  </div>
                  <div style="margin-top:8px;font-size:30px;line-height:36px;color:#ffffff;font-weight:800;">
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
                  <div style="font-size:12px;color:#64748b;line-height:18px;">
                    Cet e-mail a été généré automatiquement par le portail de gestion des références BDO DRC.
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
      <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;width:220px;vertical-align:top;">
        <span style="font-weight:700;color:#0f172a;">${label}</span>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#334155;">
        ${value}
      </td>
    </tr>
  `;
}

export async function sendRiskReviewRequestEmail(
  params: EngagementRequestEmailParams
) {
  const reviewUrl = `${APP_BASE_URL}/engagement/request/review/${params.reviewToken}`;

  const to = [
    "sarman.ilunga@bdo-ea.com",
    "brakini.biavanga@bdo-ea.com",
  ];

  const subject = `Validation requise - Lettre d’engagement - ${params.clientName}`;

  const content = `
    <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#334155;">
      Une nouvelle demande de numéro de référence pour une lettre d’engagement a été soumise et nécessite une validation de la team risque.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:24px 0;">
      ${detailRow("Demandeur", params.requesterName)}
      ${detailRow("Email du demandeur", params.requesterEmail)}
      ${detailRow("Client", params.clientName)}
      ${detailRow("Département", params.departmentName)}
      ${detailRow("Date du contrat", params.contractDate)}
      ${detailRow("Signataire", params.signatoryName)}
    </table>

    <div style="margin:28px 0;">
      <a href="${reviewUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px;">
        Ouvrir la demande
      </a>
    </div>

    <p style="margin:20px 0 8px 0;font-size:14px;color:#475569;">
      Si le bouton ne fonctionne pas, utilisez ce lien :
    </p>

    <p style="margin:0;font-size:14px;line-height:22px;word-break:break-all;color:#2563eb;">
      ${reviewUrl}
    </p>
  `;

  const html = baseEmailLayout("Demande de validation", content);

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Erreur envoi mail validation risque: ${error.message}`);
  }

  return data;
}

type ApprovalEmailParams = {
  requesterEmail: string;
  requesterName: string;
  referenceNumber: string;
};

export async function sendApprovalEmail(params: ApprovalEmailParams) {
  const subject = "Votre demande de numéro de référence a été approuvée";

  const content = `
    <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#334155;">
      Bonjour <strong>${params.requesterName}</strong>,
    </p>

    <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#334155;">
      Votre demande de numéro de référence pour la lettre d’engagement a été <strong style="color:#166534;">approuvée</strong> par la team risque.
    </p>

    <div style="margin:24px 0;padding:18px 20px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;">
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#166534;font-weight:700;margin-bottom:8px;">
        Numéro de référence
      </div>
      <div style="font-size:22px;line-height:30px;color:#166534;font-weight:800;word-break:break-all;">
        ${params.referenceNumber}
      </div>
    </div>

    <p style="margin:18px 0 0 0;font-size:16px;line-height:26px;color:#334155;">
      Vous pouvez à présent utiliser ce numéro dans le cadre de votre lettre d’engagement.
    </p>
  `;

  const html = baseEmailLayout("Demande approuvée", content);

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [params.requesterEmail],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Erreur envoi mail approbation: ${error.message}`);
  }

  return data;
}

type RejectionEmailParams = {
  requesterEmail: string;
  requesterName: string;
  rejectionReason: string;
};

export async function sendRejectionEmail(params: RejectionEmailParams) {
  const subject = "Votre demande de numéro de référence a été refusée";

  const content = `
    <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#334155;">
      Bonjour <strong>${params.requesterName}</strong>,
    </p>

    <p style="margin:0 0 18px 0;font-size:16px;line-height:26px;color:#334155;">
      Votre demande de numéro de référence pour la lettre d’engagement a été <strong style="color:#b91c1c;">refusée</strong> par la team risque.
    </p>

    <div style="margin:24px 0;padding:18px 20px;border:1px solid #fecaca;background:#fef2f2;border-radius:12px;">
      <div style="font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#b91c1c;font-weight:700;margin-bottom:8px;">
        Motif du refus
      </div>
      <div style="font-size:16px;line-height:26px;color:#7f1d1d;">
        ${params.rejectionReason}
      </div>
    </div>

    <p style="margin:18px 0 0 0;font-size:16px;line-height:26px;color:#334155;">
      Merci de corriger les éléments nécessaires avant de soumettre une nouvelle demande.
    </p>
  `;

  const html = baseEmailLayout("Demande refusée", content);

  const { data, error } = await resend.emails.send({
    from: RESEND_FROM,
    to: [params.requesterEmail],
    subject,
    html,
  });

  if (error) {
    throw new Error(`Erreur envoi mail refus: ${error.message}`);
  }

  return data;
}