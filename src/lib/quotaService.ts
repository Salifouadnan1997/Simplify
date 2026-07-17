import localforage from 'localforage';

export const quotaDb = localforage.createInstance({
  name: "SaisieIntelligente",
  storeName: "quotas"
});

export interface QuotaState {
  plan: string;
  ocrUsed: number;
  aiUsed: number;
}

const DEFAULT_QUOTA: QuotaState = {
  plan: 'Gratuit',
  ocrUsed: 0,
  aiUsed: 0
};

export async function getQuotas(): Promise<QuotaState> {
  const quotas = await quotaDb.getItem<QuotaState>('currentQuotas');
  if (!quotas) {
    const plan = localStorage.getItem("saisie_intelligente_plan") || 'Gratuit';
    const init = { ...DEFAULT_QUOTA, plan };
    await quotaDb.setItem('currentQuotas', init);
    return init;
  }
  return quotas;
}

export async function incrementQuota(type: 'ocrUsed' | 'aiUsed') {
  const quotas = await getQuotas();
  quotas[type] += 1;
  await quotaDb.setItem('currentQuotas', quotas);
  return quotas;
}

export async function updatePlan(planName: string) {
  const quotas = await getQuotas();
  quotas.plan = planName;
  await quotaDb.setItem('currentQuotas', quotas);
  localStorage.setItem("saisie_intelligente_plan", planName);
  return quotas;
}

export async function checkQuota(type: 'documentsCreated' | 'ocrUsed' | 'aiUsed', currentDocsCount: number = 0): Promise<{ allowed: boolean; message?: string }> {
  const quotas = await getQuotas();
  if (quotas.plan === 'Pro' || quotas.plan === 'Business' || quotas.plan === 'Formule Professionnelle') {
    return { allowed: true }; // Unlimited for paid plans
  }
  
  // Free plan limits
  switch (type) {
    case 'documentsCreated':
      if (currentDocsCount >= 3) {
        return { allowed: false, message: "Limite atteinte. Le plan gratuit permet de créer jusqu'à 3 documents." };
      }
      return { allowed: true };
    case 'ocrUsed':
      if (quotas.ocrUsed >= 5) {
        return { allowed: false, message: "Limite atteinte. Le plan gratuit permet d'utiliser l'OCR 5 fois." };
      }
      return { allowed: true };
    case 'aiUsed':
      if (quotas.aiUsed >= 5) {
        return { allowed: false, message: "Limite atteinte. L'assistant IA est limité à 5 utilisations en plan gratuit." };
      }
      return { allowed: true };
    default:
      return { allowed: true };
  }
}
