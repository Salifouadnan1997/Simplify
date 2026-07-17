import React, { useState, useEffect, useRef } from "react";
import { LayoutTemplate, Plus, Search, Trash2, CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: "Facture" | "Contrat" | "Lettre" | "Autre";
  content: string;
  isCustom?: boolean;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "tpl-facture-pro",
    name: "Facture Minimaliste (Pro)",
    category: "Facture",
    content: `
      <div style="font-family: 'Space Grotesk', sans-serif; color: #1e293b; padding: 40px; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div>
            <div style="font-size: 38px; font-weight: 800; color: #2563eb;">FACTURE</div>
            <div style="font-size: 13px; color: #64748b;">N° [NUMERO_FACTURE]</div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #64748b;">
            <strong>[MON_ENTREPRISE]</strong><br>[MON_ADRESSE]
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <div style="font-size: 13px;">
            <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Facturé à</div>
            <strong>[NOM_CLIENT]</strong><br>[ADRESSE_CLIENT]
          </div>
          <div style="font-size: 13px; text-align: right;">
            <div style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Date</div>
            <strong>[DATE_JOUR]</strong>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #0f172a; text-align: left;">
              <th style="padding: 8px 0;">Description</th>
              <th style="text-align: right; padding: 8px 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 12px 0;">[PRESTATION_1]</td>
              <td style="text-align: right; padding: 12px 0; font-weight: 600;">0.00 €</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: auto; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          Merci de votre confiance.
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-contrat-elegant",
    name: "Contrat Élégant",
    category: "Contrat",
    content: `
      <div style="font-family: 'Playfair Display', serif; color: #334155; padding: 40px; background-color: #fafaf9; height: 100%; border: 6px solid #fff; box-shadow: inset 0 0 0 1px #e5e5e5;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 10px; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.2em; color: #a8a29e;">Document Légal</div>
          <h1 style="font-size: 24px; font-weight: 600; color: #1c1917; margin: 10px 0;">CONTRAT DE PRESTATION</h1>
          <div style="width: 30px; height: 2px; background-color: #d6d3d1; margin: 15px auto 0;"></div>
        </div>
        <div style="font-size: 13px; line-height: 1.7; font-family: 'Inter', sans-serif; margin-bottom: 30px;">
          <p><strong>Entre les soussignés :</strong> [MON_ENTREPRISE] ("Le Prestataire") et [NOM_CLIENT] ("Le Client").</p>
          <h2 style="font-size: 14px; font-family: 'Playfair Display', serif; color: #1c1917; margin: 20px 0 10px;">Article 1 — Objet</h2>
          <p>[DESCRIPTION_MISSION]</p>
          <h2 style="font-size: 14px; font-family: 'Playfair Display', serif; color: #1c1917; margin: 20px 0 10px;">Article 2 — Rémunération</h2>
          <p>Le Client s'engage à payer la somme de [MONTANT_CONTRAT] euros.</p>
        </div>
        <div style="display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 12px; margin-top: 40px;">
          <div>
            <div>Fait le [DATE_JOUR]</div>
            <strong style="display: block; margin-top: 5px;">Le Prestataire</strong>
          </div>
          <div style="text-align: right;">
            <div>Fait le [DATE_JOUR]</div>
            <strong style="display: block; margin-top: 5px;">Le Client</strong>
          </div>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-lettre-moderne",
    name: "Lettre Moderne",
    category: "Lettre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; padding: 0; height: 100%; display: flex;">
        <div style="width: 25%; background-color: #0f172a; color: #f8fafc; padding: 30px 20px;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Expéditeur</div>
          <div style="font-size: 13px; font-weight: 600; margin-top: 5px;">[MON_NOM]</div>
          <div style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin-top: 5px;">[MON_ADRESSE]</div>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 30px;">Date</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 5px;">[DATE_JOUR]</div>
        </div>
        <div style="width: 75%; padding: 40px 30px; background-color: #ffffff;">
          <div style="margin-bottom: 30px; text-align: right;">
            <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">À</div>
            <div style="font-size: 14px; font-weight: 600; color: #0f172a;">[NOM_DESTINATAIRE]</div>
            <div style="font-size: 12px; color: #64748b;">[ADRESSE_DESTINATAIRE]</div>
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
            Objet : [OBJET_LETTRE]
          </div>
          <div style="font-size: 13px; line-height: 1.7; color: #334155;">
            <p>Madame, Monsieur,</p>
            <p style="margin: 15px 0;">[CORPS_DE_LA_LETTRE]</p>
            <p>Veuillez agréer mes salutations distinguées.</p>
          </div>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-presentation-titre",
    name: "Page de Garde (Présentation)",
    category: "Autre",
    content: `
      <div style="font-family: 'Space Grotesk', sans-serif; height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #4f46e5 0%, #2563eb 100%); color: white; padding: 40px; text-align: center;">
        <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.7); margin-bottom: 20px;">
          Rapport Stratégique
        </div>
        <h1 style="font-size: 42px; font-weight: 800; line-height: 1.1; margin-bottom: 20px;">
          [TITRE_PRINCIPAL]
        </h1>
        <div style="font-size: 16px; color: rgba(255,255,255,0.9); max-width: 500px; margin-bottom: 40px;">
          [SOUS_TITRE_PRESENTATION]
        </div>
        <div style="margin-top: auto; display: flex; justify-content: space-between; width: 100%; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 20px; font-size: 12px;">
          <span>Préparé par <strong>[NOM_AUTEUR]</strong></span>
          <span>Date : <strong>[MOIS_ANNEE]</strong></span>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-nano-banana-1",
    name: "Design 'Nano Banana'",
    category: "Autre",
    content: `
      <div style="font-family: 'Inter', sans-serif; height: 100%; display: flex; flex-direction: column; background: #fffbe4; color: #1e293b; padding: 40px; border: 6px solid #fcd34d;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
          <div style="font-weight: 900; font-size: 20px; color: #d97706;">🍌 NANO</div>
          <div style="font-size: 10px; font-weight: 700; background: #d97706; color: white; padding: 3px 10px; border-radius: 20px;">Édition Limitée</div>
        </div>
        <h1 style="font-size: 48px; font-weight: 900; color: #78350f; margin-bottom: 15px; line-height: 1;">
          BANANA SPLIT
        </h1>
        <div style="font-size: 15px; color: #92400e; margin-bottom: 30px; max-width: 380px;">
          Un design pop et fruité pour capter instantanément l'attention de vos lecteurs.
        </div>
        <div style="display: flex; gap: 15px; margin-bottom: 30px;">
          <div style="flex: 1; background: white; padding: 15px; border-radius: 12px; border: 2px solid #fde68a;">
            <div style="font-size: 24px; font-weight: 800; color: #d97706;">01</div>
            <div style="font-size: 12px; font-weight: 600; color: #78350f;">Créativité</div>
          </div>
          <div style="flex: 1; background: #d97706; padding: 15px; border-radius: 12px; color: white;">
            <div style="font-size: 24px; font-weight: 800; color: #fde68a;">02</div>
            <div style="font-size: 12px; font-weight: 600;">Efficacité</div>
          </div>
        </div>
        <div style="margin-top: auto; font-size: 12px; font-weight: 700; color: #b45309;">
          [VOTRE_PROJET] • Pop Design
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-magazine-chic",
    name: "Éditorial Chic",
    category: "Autre",
    content: `
      <div style="font-family: 'Playfair Display', serif; height: 100%; display: flex; flex-direction: column; background: #fafaf9; color: #1c1917; padding: 40px;">
        <div style="display: flex; justify-content: space-between; font-family: 'Inter', sans-serif; font-size: 9px; text-transform: uppercase; color: #a8a29e; margin-bottom: 30px;">
          <span>Édition Chic</span>
          <span>Vol. 42</span>
        </div>
        <h1 style="font-size: 38px; font-weight: 400; line-height: 1.1; margin-bottom: 20px; font-style: italic;">
          L'Art de vivre <span style="font-style: normal; font-weight: 600;">Moderne</span>
        </h1>
        <div style="display: flex; gap: 30px; flex: 1; margin-top: 20px;">
          <div style="flex: 1; font-family: 'Inter', sans-serif; font-size: 12px; line-height: 1.6; color: #57534e;">
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae eros quis risus semper bibendum. Nunc quis velit rutrum.</p>
          </div>
          <div style="flex: 1; background: #e7e5e4; display: flex; align-items: center; justify-content: center; font-size: 60px; color: #cbd5e1; font-weight: 800;">
            03
          </div>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-neon-cyber",
    name: "Neon Cyber",
    category: "Autre",
    content: `
      <div style="font-family: 'JetBrains Mono', monospace; height: 100%; display: flex; flex-direction: column; background: #0f172a; color: #38bdf8; padding: 40px; border: 3px solid #c084fc;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px;">
          <div style="font-size: 12px; color: #c084fc;">// SYSTEM_INIT</div>
          <div style="font-size: 10px; color: #0f172a; background: #38bdf8; padding: 2px 8px;">V2.0</div>
        </div>
        <h1 style="font-size: 42px; font-weight: 800; color: #f8fafc; margin-bottom: 20px; text-shadow: 0 0 10px rgba(56,189,248,0.5);">
          CYBER<span style="color: #c084fc;">NEXUS</span>
        </h1>
        <div style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 30px;">
          > CONNECTING TO SERVER...<br>
          > DISCOVERY COMPLETED.<br>
          > STABLE NODE DETECTED.
        </div>
        <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid rgba(148,163,184,0.2); padding-top: 15px;">
          <span>[ SECURE PIPELINE ]</span>
          <span style="color: #38bdf8;">ONLINE</span>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-pastel-dream",
    name: "Pastel Dream",
    category: "Autre",
    content: `
      <div style="font-family: 'Inter', sans-serif; height: 100%; display: flex; flex-direction: column; background: linear-gradient(135deg, #fdf4ff 0%, #f0fdf4 100%); color: #334155; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="font-size: 12px; font-weight: 700; color: #db2777; text-transform: uppercase;">Inspiration</div>
          <h1 style="font-family: 'Playfair Display', serif; font-size: 38px; font-weight: 700; color: #1e293b; margin-top: 10px;">
            Douceur & Harmonie
          </h1>
        </div>
        <div style="background: rgba(255,255,255,0.7); padding: 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.5); text-align: center; margin: auto 0;">
          <p style="font-size: 13px; color: #475569; line-height: 1.6;">
            Plongez dans un univers pastel où la créativité rencontre la sérénité au quotidien.
          </p>
        </div>
        <div style="text-align: center; font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-top: auto;">
          Design Doux • Collection Zen
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-lettre-motivation",
    name: "Lettre de Motivation (Épurée)",
    category: "Lettre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <div style="font-size: 18px; font-weight: 700; color: #0f172a;">[MON_NOM]</div>
            <div style="font-size: 11px; color: #64748b;">[MON_ADRESSE]</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">[DATE_JOUR]</div>
        </div>
        <div style="margin-left: auto; width: 50%; margin-bottom: 30px; font-size: 12px;">
          <strong style="color: #0f172a;">[NOM_DESTINATAIRE]</strong><br>[ADRESSE_DESTINATAIRE]
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 20px;">
          Objet : Candidature au poste de [NOM_POSTE]
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #334155; flex-grow: 1;">
          <p>Madame, Monsieur,</p>
          <p style="margin: 10px 0;">C'est avec un vif intérêt que je postule pour le poste de [NOM_POSTE]. Passionné par mon domaine, j'aspire à intégrer vos équipes dynamiques.</p>
          <p>Je reste disponible pour toute rencontre constructive.</p>
        </div>
        <div style="text-align: right; font-weight: 700; font-size: 12px;">[MON_NOM]</div>
      </div>
    `.trim()
  },
  {
    id: "tpl-contrat-freelance",
    name: "Contrat de Freelance",
    category: "Contrat",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #334155; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <h1 style="font-size: 20px; font-weight: 800; color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">CONTRAT INDÉPENDANT</h1>
        <div style="font-size: 12px; line-height: 1.6;">
          <p><strong>Prestataire :</strong> [MON_ENTREPRISE]</p>
          <p><strong>Client :</strong> [NOM_CLIENT]</p>
          <h2 style="font-size: 13px; font-weight: 700; color: #1e3a8a; margin-top: 15px;">Missions</h2>
          <p>[DESCRIPTION_MISSION]</p>
          <h2 style="font-size: 13px; font-weight: 700; color: #1e3a8a; margin-top: 15px;">Budget</h2>
          <p>Forfait convenu : [MONTANT_CONTRAT] € HT.</p>
        </div>
        <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <div>Signature Prestataire</div>
          <div style="text-align: right;">Signature Client</div>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-facture-honoraires",
    name: "Facture d'Honoraires",
    category: "Facture",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: #0369a1; margin: 0;">FACTURE D'HONORAIRES</h1>
            <p style="font-size: 11px; color: #6b7280; margin-top: 3px;">N° [NUMERO_FACTURE]</p>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <strong>[MON_ENTREPRISE]</strong><br>[MON_ADRESSE]
          </div>
        </div>
        <div style="margin-bottom: 30px; border-left: 3px solid #0369a1; padding-left: 10px; font-size: 12px;">
          <strong>Destinataire :</strong> [NOM_CLIENT]<br>[ADRESSE_CLIENT]
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; text-align: left;">
              <th style="padding: 6px;">Prestation</th>
              <th style="text-align: right; padding: 6px;">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px;">[PRESTATION_1]</td>
              <td style="text-align: right; padding: 8px; font-weight: 600;">[MONTANT_FACTURE] €</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top: auto; font-size: 11px; color: #9ca3af; text-align: center;">TVA non applicable.</div>
      </div>
    `.trim()
  },
  {
    id: "tpl-devis-renov",
    name: "Devis Rénovation",
    category: "Facture",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #374151; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #059669; padding-bottom: 10px;">
          <h1 style="font-size: 22px; font-weight: 800; color: #059669; margin: 0;">DEVIS DE TRAVAUX</h1>
          <div style="text-align: right; font-size: 11px;">[MON_ENTREPRISE]</div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 11px;">
          <div><strong>Lieu du chantier :</strong><br>[ADRESSE_CLIENT]</div>
          <div style="text-align: right;"><strong>Client :</strong><br>[NOM_CLIENT]</div>
        </div>
        <div style="font-size: 12px; line-height: 1.6; flex-grow: 1;">
          <strong>Détails des travaux prévus :</strong>
          <p style="background: #f0fdf4; padding: 10px; border-radius: 6px; margin: 10px 0;">[DESCRIPTION_TRAVAUX]</p>
          <div style="text-align: right; font-weight: 700; color: #059669; font-size: 14px; margin-top: 15px;">
            Estimation globale : [MONTANT_ESTIME] €
          </div>
        </div>
        <div style="font-size: 10px; color: #6b7280; text-align: center; margin-top: auto;">Valide 3 mois.</div>
      </div>
    `.trim()
  },
  {
    id: "tpl-rapport-annuel",
    name: "Rapport Annuel",
    category: "Autre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background-color: #fafaf9; height: 100%; display: flex; flex-direction: column;">
        <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
          <span style="font-size: 10px; font-weight: 800; color: #f97316; text-transform: uppercase;">Synthèse</span>
          <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin-top: 5px;">RAPPORT D'ACTIVITÉ [ANNEE]</h1>
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #334155; flex-grow: 1;">
          <p>L'année écoulée a été marquée par l'atteinte d'objectifs clés et une accélération de notre croissance digitale.</p>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 22px; font-weight: 800; color: #f97316;">+[POURCENTAGE]%</div>
            <div style="font-size: 10px; color: #64748b;">De Chiffre d'Affaires réalisé</div>
          </div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          <span>Rédacteur : [AUTEUR_RAPPORT]</span>
          <span>Date : [DATE_RAPPORT]</span>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-accord-nda",
    name: "Accord de Confidentialité (NDA)",
    category: "Contrat",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #111827; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column; border: 1px solid #cbd5e1;">
        <h1 style="font-size: 18px; font-weight: 800; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #111827; padding-bottom: 10px;">ACCORD DE CONFIDENTIALITÉ (NDA)</h1>
        <div style="font-size: 11px; line-height: 1.6; color: #374151;">
          <p><strong>Parties :</strong> [NOM_PARTIE_A] ("Émetteur") et [NOM_PARTIE_B] ("Récepteur").</p>
          <p style="margin: 15px 0;">Les signataires conviennent d'assurer la confidentialité absolue des informations techniques et stratégiques échangées lors de leurs entretiens.</p>
          <p>Toute divulgation non autorisée entraînera de plein droit des poursuites réglementaires.</p>
        </div>
        <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 11px;">
          <div>Signé par Partie A :<br>_________________</div>
          <div style="text-align: right;">Signé par Partie B :<br>_________________</div>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-lettre-demission",
    name: "Lettre de Démission",
    category: "Lettre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1f2937; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="font-size: 11px; margin-bottom: 25px;">
          <strong>[MON_NOM]</strong><br>[MON_TELEPHONE]
        </div>
        <div style="margin-left: auto; width: 50%; margin-bottom: 25px; font-size: 11px;">
          <strong>[NOM_ENTREPRISE]</strong><br>[ADRESSE_ENTREPRISE]
        </div>
        <div style="font-size: 12px; font-weight: 700; margin-bottom: 20px;">
          Objet : Démission de mon poste de [NOM_POSTE]
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #374151; flex-grow: 1;">
          <p>Madame, Monsieur,</p>
          <p style="margin: 10px 0;">Je vous informe de ma décision de démissionner de mon poste de [NOM_POSTE]. Conformément à mon contrat, je respecterai un préavis de [DUREE_PREAVIS].</p>
          <p>Mon contrat de travail s'achèvera donc le [DATE_FIN_CONTRAT].</p>
        </div>
        <div style="text-align: right; font-weight: 700; font-size: 12px;">[MON_NOM]</div>
      </div>
    `.trim()
  },
  {
    id: "tpl-pv-reunion",
    name: "Procès-Verbal de Réunion",
    category: "Autre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px;">
          <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">PROCÈS-VERBAL DE RÉUNION</h1>
        </div>
        <div style="font-size: 11px; background-color: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 20px; color: #475569;">
          <strong>Date :</strong> [DATE_REUNION] | <strong>Lieu :</strong> [LIEU_REUNION]<br>
          <strong>Président :</strong> [NOM_PRESIDENT] | <strong>Secrétaire :</strong> [NOM_SECRETAIRE]
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #334155; flex-grow: 1;">
          <h3 style="font-weight: 700; color: #0f172a; margin-bottom: 5px;">Ordre du jour</h3>
          <p style="background: #f1f5f9; padding: 8px; border-radius: 4px;">[ORDRE_DU_JOUR]</p>
        </div>
        <div style="margin-top: auto; display: flex; justify-content: space-between; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 15px; color: #64748b;">
          <span>PV établi par : [NOM_SECRETAIRE]</span>
          <span>Visa : _________________</span>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-cv-design",
    name: "Curriculum Vitae (Design)",
    category: "Autre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #334155; padding: 0; background-color: #ffffff; height: 100%; display: flex;">
        <div style="width: 35%; background-color: #f3f4f6; padding: 30px 15px; font-size: 11px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background-color: #cbd5e1; margin: 0 auto 10px;"></div>
            <strong style="font-size: 14px; color: #111827;">[MON_NOM]</strong><br>
            <span style="color: #4f46e5; font-size: 10px;">[MON_POSTE]</span>
          </div>
          <strong>Contact</strong>
          <p>[MON_TELEPHONE]<br>[MON_EMAIL]</p>
        </div>
        <div style="width: 65%; padding: 30px; font-size: 11px;">
          <strong style="font-size: 13px; color: #4f46e5; border-bottom: 2px solid #f3f4f6; display: block; padding-bottom: 4px; margin-bottom: 10px;">Profil</strong>
          <p>[MON_PROFIL_PRO]</p>
          <strong style="font-size: 13px; color: #4f46e5; border-bottom: 2px solid #f3f4f6; display: block; padding-bottom: 4px; margin-bottom: 10px; margin-top: 20px;">Expérience</strong>
          <p><strong>[POSTE_OCCUPE]</strong> - [NOM_ENTREPRISE]</p>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-relance-facture",
    name: "Lettre de Relance Facture",
    category: "Lettre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="font-size: 11px; margin-bottom: 30px;">
          <strong>[MON_ENTREPRISE]</strong><br>[MON_TELEPHONE]
        </div>
        <div style="margin-left: auto; width: 50%; margin-bottom: 30px; font-size: 11px;">
          <strong>[NOM_CLIENT]</strong><br>[ADRESSE_CLIENT]
        </div>
        <h2 style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
          Objet : Rappel de paiement — Facture N° [NUMERO_FACTURE]
        </h2>
        <div style="font-size: 12px; line-height: 1.6; color: #334155; flex-grow: 1;">
          <p>Madame, Monsieur,</p>
          <p style="margin: 10px 0;">Le règlement de la facture citée ci-dessus, datée du [DATE_FACTURE] et d'un montant de [MONTANT_FACTURE] €, ne nous est pas parvenu.</p>
          <p>Nous vous demandons de régulariser cette situation rapidement.</p>
        </div>
        <div style="text-align: right; font-weight: 700; font-size: 12px;">[MON_NOM]</div>
      </div>
    `.trim()
  },
  {
    id: "tpl-cert-travail",
    name: "Certificat de Travail",
    category: "Contrat",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #111827; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column; border: 1px solid #e5e7eb;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 20px; font-weight: 800; margin: 0; letter-spacing: 0.05em;">CERTIFICAT DE TRAVAIL</h1>
        </div>
        <div style="font-size: 12px; line-height: 1.7; color: #374151; flex-grow: 1;">
          <p>Je soussigné, [NOM_SIGNATAIRE], [QUALITE_SIGNATAIRE] chez [NOM_ENTREPRISE], certifie que :</p>
          <p style="font-size: 14px; font-weight: 600; text-align: center; margin: 15px 0;">[NOM_SALARIE]</p>
          <p>A été salarié de notre entreprise du [DATE_ENTREE] au [DATE_SORTIE], en qualité de [POSTE_OCCUPE].</p>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: auto; color: #6b7280;">
          <span>Fait à [VILLE], le [DATE_JOUR]</span>
          <span>Signature employeur :<br><br>_________________</span>
        </div>
      </div>
    `.trim()
  },
  {
    id: "tpl-ordre-jour",
    name: "Ordre du Jour",
    category: "Autre",
    content: `
      <div style="font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; background-color: #ffffff; height: 100%; display: flex; flex-direction: column;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
          <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0;">ORDRE DU JOUR</h1>
          <div style="font-size: 11px; color: #64748b;">Le [DATE_REUNION]</div>
        </div>
        <div style="font-size: 12px; line-height: 1.6; color: #334155; flex-grow: 1;">
          <h3 style="font-weight: 700; color: #0f172a; margin-bottom: 5px;">Thème : [THEME_REUNION]</h3>
          <p>Afin de maximiser l'efficacité de notre prochaine session de travail, voici les points abordés :</p>
          <ul style="margin-top: 10px; padding-left: 15px;">
            <li>1. Point d'avancement des projets</li>
            <li>2. Répartition des budgets</li>
            <li>3. Planification opérationnelle</li>
          </ul>
        </div>
      </div>
    `.trim()
  }
];

interface TemplatesPanelProps {
  onInsertTemplate: (content: string) => void;
}

export default function TemplatesPanel({ onInsertTemplate }: TemplatesPanelProps) {
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<Template["category"]>("Autre");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("document_templates_custom");
    if (saved) {
      try {
        const customTemplates = JSON.parse(saved);
        setTemplates([...DEFAULT_TEMPLATES, ...customTemplates]);
      } catch (err) {
        console.error("Erreur de parsing des modèles customisés.");
      }
    }
  }, []);

  const saveCustomTemplates = (customTpls: Template[]) => {
    localStorage.setItem("document_templates_custom", JSON.stringify(customTpls));
    setTemplates([...DEFAULT_TEMPLATES, ...customTpls]);
  };

  const handleAddCustomTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateContent.trim()) return;

    const newTpl: Template = {
      id: "tpl-custom-" + Math.random().toString(36).substr(2, 9),
      name: newTemplateName,
      category: newTemplateCategory,
      content: newTemplateContent,
      isCustom: true
    };

    const customTpls = templates.filter(t => t.isCustom);
    saveCustomTemplates([...customTpls, newTpl]);
    
    setNewTemplateName("");
    setNewTemplateContent("");
    setShowCustomForm(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const customTpls = templates.filter(t => t.isCustom && t.id !== id);
    saveCustomTemplates(customTpls);
  };

  const categories = ["Toutes", "Facture", "Contrat", "Lettre", "Autre"];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "Toutes" || t.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Intro info */}
      <div className="flex justify-between items-start shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight flex items-center">
            <LayoutTemplate className="mr-2 text-blue-600" size={16} />
            Modèles de Documents
          </h3>
          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
            Utilisez des structures pré-définies avec zones dynamiques, ou créez vos propres modèles.
          </p>
        </div>
        {!showCustomForm && (
          <button
            onClick={() => setShowCustomForm(true)}
            className="flex items-center space-x-1 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors"
          >
            <Plus size={14} />
            <span>Nouveau</span>
          </button>
        )}
      </div>

      {showCustomForm ? (
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-sm space-y-4 animate-fadeIn flex-1 overflow-y-auto">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">
            Créer un Modèle Personnalisé
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nom du modèle</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                placeholder="Ex: Mon Contrat Freelance"
                className="w-full text-xs p-2 border border-slate-300 rounded-sm focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Catégorie</label>
              <select
                value={newTemplateCategory}
                onChange={e => setNewTemplateCategory(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-300 rounded-sm focus:border-blue-500 outline-none bg-white"
              >
                <option value="Facture">Facture</option>
                <option value="Contrat">Contrat</option>
                <option value="Lettre">Lettre</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contenu (Texte / Markdown)</label>
              <textarea
                value={newTemplateContent}
                onChange={e => setNewTemplateContent(e.target.value)}
                placeholder="Insérez des placeholders comme [NOM_CLIENT] pour faciliter l'autocomplétion plus tard."
                className="w-full flex-1 min-h-[150px] text-xs font-mono p-2 border border-slate-300 rounded-sm focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowCustomForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-sm font-bold uppercase tracking-wider"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCustomTemplate}
                disabled={!newTemplateName.trim() || !newTemplateContent.trim()}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider disabled:opacity-50"
              >
                <Save size={14} />
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-sm focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto scrollbar-none pb-1 shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  activeCategory === cat ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center shrink-0 mt-2 mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Modèles Disponibles</span>
            <div className="flex space-x-1">
              <button
                onClick={scrollLeft}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm transition-colors"
                title="Précédent"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={scrollRight}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-sm transition-colors"
                title="Suivant"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto flex space-x-4 pb-4 pr-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-slate-400 w-full shrink-0 flex flex-col justify-center items-center">
                <LayoutTemplate size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-[10px] uppercase font-bold tracking-wider">Aucun modèle trouvé</p>
              </div>
            ) : (
              filteredTemplates.map(tpl => (
                <div key={tpl.id} className="group p-3 border border-slate-200 rounded-sm bg-white hover:border-blue-300 hover:shadow-sm transition-all flex flex-col w-[260px] shrink-0 snap-start">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{tpl.name}</h4>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-sm font-bold uppercase tracking-wider">
                          {tpl.category}
                        </span>
                        {tpl.isCustom && (
                          <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wider">
                            Personnalisé
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {tpl.isCustom && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-sm"
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => onInsertTemplate(tpl.content)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-sm"
                        title="Insérer ce modèle"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="w-full aspect-[1/1.414] bg-slate-50 mt-2 border border-slate-100 rounded-sm overflow-hidden relative pointer-events-none transform scale-[1] origin-top">
                    <div 
                      className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25]"
                      dangerouslySetInnerHTML={{ __html: tpl.content }}
                    />
                  </div>
                  <button
                    onClick={() => onInsertTemplate(tpl.content)}
                    className="mt-auto pt-3 w-full py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-sm flex justify-center items-center space-x-1 transition-colors border border-blue-100 hover:border-blue-600"
                  >
                    <CheckCircle2 size={12} />
                    <span>Utiliser ce Modèle</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
