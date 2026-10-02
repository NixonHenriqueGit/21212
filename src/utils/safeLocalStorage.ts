/**
 * Global protection for Storage.prototype.setItem against QuotaExceededError
 */

function trimJsonArrayString(jsonStr: string, maxItems = 250): string {
  if (!jsonStr || jsonStr.length < 10000) return jsonStr;
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > maxItems) {
      return JSON.stringify(parsed.slice(-maxItems));
    }
  } catch (_) {}
  return jsonStr;
}

function isCriticalUserDataKey(key: string): boolean {
  if (!key) return false;
  return (
    key.includes('af_estoque_') ||
    key.includes('af_posicao_pallet_') ||
    key.includes('af_capacity_') ||
    key.includes('af_warehouse_') ||
    key.includes('af_pop_doc_') ||
    key.includes('0205') ||
    key.includes('021101') ||
    key.includes('venda_media') ||
    key.includes('colaboradores') ||
    key.includes('acoes_rows') ||
    key.includes('dpo_audits') ||
    key.includes('repack_rows') ||
    key.includes('repack_manual') ||
    key.includes('quebras') ||
    key.includes('custom_quebras') ||
    key.includes('despejo') ||
    key.includes('validades') ||
    key.includes('pnc_despejo_tasks')
  );
}

export function initSafeLocalStorage() {
  if (typeof window === 'undefined' || !window.Storage) return;

  // Patch window.alert to prevent iframe sandbox blocking
  try {
    const originalAlert = window.alert ? window.alert.bind(window) : null;
    window.alert = (message?: any): void => {
      try {
        if (originalAlert) {
          originalAlert(message);
        } else {
          console.info('[Alert Notice]:', message);
        }
      } catch (err) {
        console.warn('[Iframe Sandbox Intercepted Alert]:', message);
      }
    };
  } catch (err) {
    console.warn('Failed to patch window.alert:', err);
  }

  // Patch window.confirm to bypass browser iframe sandbox blocking on modal dialogs
  try {
    const originalConfirm = window.confirm ? window.confirm.bind(window) : null;
    window.confirm = (message?: string): boolean => {
      if (originalConfirm) {
        try {
          return originalConfirm(message);
        } catch (err) {
          return true;
        }
      }
      return true;
    };
  } catch (err) {
    console.warn('Failed to patch window.confirm:', err);
  }

  // Patch window.prompt to bypass browser iframe sandbox blocking
  try {
    const originalPrompt = window.prompt ? window.prompt.bind(window) : null;
    window.prompt = (message?: string, _default?: string): string | null => {
      if (originalPrompt) {
        try {
          return originalPrompt(message, _default);
        } catch (err) {
          return _default || null;
        }
      }
      return _default || null;
    };
  } catch (err) {
    console.warn('Failed to patch window.prompt:', err);
  }

  // Patch window.open to avoid blocked iframe popup errors
  try {
    const originalOpen = window.open ? window.open.bind(window) : null;
    window.open = (url?: string | URL, target?: string, features?: string): Window | null => {
      if (originalOpen) {
        try {
          return originalOpen(url, target, features);
        } catch (err) {
          console.warn('[Iframe Sandbox Intercepted window.open]:', url);
          return null;
        }
      }
      return null;
    };
  } catch (err) {
    console.warn('Failed to patch window.open:', err);
  }

  const originalSetItem = Storage.prototype.setItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    let valueToStore = value;

    try {
      originalSetItem.call(this, key, valueToStore);
    } catch (e: any) {
      if (
        e?.name === 'QuotaExceededError' ||
        e?.code === 22 ||
        e?.code === 1014 ||
        String(e).toLowerCase().includes('quota') ||
        String(e).toLowerCase().includes('exceeded')
      ) {
        // Phase 1: Clear ONLY non-critical temporary cache items
        const keysToRemove: string[] = [];
        const keysToTrim: string[] = [];

        for (let i = this.length - 1; i >= 0; i--) {
          const k = this.key(i);
          if (!k || isCriticalUserDataKey(k)) continue;

          if (
            k.startsWith('backups_') ||
            k.startsWith('landing_page_') ||
            k.startsWith('firestore_') ||
            k.startsWith('firebase_') ||
            k.startsWith('local_acessos_') ||
            k.includes('_temp_') ||
            k.includes('_cache_')
          ) {
            keysToRemove.push(k);
          } else if (k !== key) {
            keysToTrim.push(k);
          }
        }

        keysToRemove.forEach(k => {
          try { this.removeItem(k); } catch (_) {}
        });

        // Try again
        try {
          originalSetItem.call(this, key, valueToStore);
          return;
        } catch (_) {}

        // Phase 2: Trim ONLY non-critical large array keys
        for (const k of keysToTrim) {
          if (isCriticalUserDataKey(k)) continue;
          try {
            const rawVal = this.getItem(k);
            if (rawVal && rawVal.length > 20000) {
              const trimmed = trimJsonArrayString(rawVal, 200);
              if (trimmed.length < rawVal.length) {
                originalSetItem.call(this, k, trimmed);
              }
            }
          } catch (_) {}
        }

        // Try again
        try {
          originalSetItem.call(this, key, valueToStore);
          return;
        } catch (_) {}

        // Phase 3: If key is critical, preserve as is; if not critical, trim
        if (!isCriticalUserDataKey(key)) {
          valueToStore = trimJsonArrayString(valueToStore, 200);
        }

        try {
          originalSetItem.call(this, key, valueToStore);
          return;
        } catch (_) {
          console.warn(`[localStorage] Handled QuotaExceededError for key "${key}". Critical user imports preserved.`);
        }
      } else {
        console.warn(`[localStorage] Handled error setting key "${key}":`, e);
      }
    }
  };
}

// Auto-run on module import
if (typeof window !== 'undefined') {
  initSafeLocalStorage();
}

export function safeSetLocalStorage<T = any>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, str);
    return true;
  } catch (e) {
    return false;
  }
}

export function safeGetLocalStorage<T = any>(key: string, fallback: T | null = null): T | null {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    if (typeof fallback === 'string') return raw as unknown as T;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch (e) {
    return fallback;
  }
}

export function purgeStaleOperationalCache(empresaId = 'demo') {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove = [
      `repack_rows_${empresaId}`,
      `quebras_${empresaId}`,
      `despejo_rows_${empresaId}`,
      `efc_efd_vehicles_${empresaId}`,
      `ronda_gsa_audits_history`,
      `armazem_rows_${empresaId}`
    ];
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
    // Trigger window events so active screens immediately reload clean official base
    window.dispatchEvent(new CustomEvent('repack-db-updated'));
    window.dispatchEvent(new CustomEvent('quebras-db-updated'));
    window.dispatchEvent(new CustomEvent('despejo-db-updated'));
    window.dispatchEvent(new CustomEvent('efc-efd-db-updated'));
  } catch (e) {
    console.warn('Error purging operational cache:', e);
  }
}


