function sanitizeHandle(handle: string) {
  return handle.trim().replace(/^@/, '').replace(/^\$/, '')
}

function formatAmount(amountDollars: number) {
  return amountDollars.toFixed(2)
}

export interface NapkinbetsPaymentLink {
  label: string
  href: string
  icon: string
  isMobileApp: boolean
}

export function useNapkinbetsPaymentLinks() {
  function buildLinks(provider: string, handle: string, amountDollars: number, note: string) {
    const links: NapkinbetsPaymentLink[] = []
    const safeHandle = sanitizeHandle(handle)
    const safeAmount = formatAmount(amountDollars)
    const safeNote = encodeURIComponent(note)

    switch (provider) {
      case 'PayPal':
        if (safeHandle) {
          links.push({
            label: 'Open PayPal.Me',
            href: `https://paypal.me/${safeHandle}/${safeAmount}`,
            icon: 'i-lucide-external-link',
            isMobileApp: false,
          })
        }
        break
      case 'Venmo':
        if (safeHandle) {
          links.push({
            label: 'Open in Venmo app',
            href: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(safeHandle)}&amount=${safeAmount}&note=${safeNote}`,
            icon: 'i-lucide-smartphone',
            isMobileApp: true,
          })
          links.push({
            label: 'Venmo profile',
            href: `https://venmo.com/u/${safeHandle}`,
            icon: 'i-lucide-external-link',
            isMobileApp: false,
          })
        }
        break
      case 'Cash App':
        if (safeHandle) {
          links.push({
            label: 'Open Cash App',
            href: `https://cash.app/$${safeHandle}/${safeAmount}`,
            icon: 'i-lucide-external-link',
            isMobileApp: false,
          })
        }
        break
      case 'Zelle':
        links.push({
          label: 'Open Zelle',
          href: 'https://www.zellepay.com/',
          icon: 'i-lucide-external-link',
          isMobileApp: false,
        })
        break
    }

    return links
  }

  function buildPaymentNote(wagerSlug: string, participantName: string, amountDollars: number) {
    const base = `NB ${wagerSlug} • entry $${formatAmount(amountDollars)}`
    if (!participantName || participantName === 'entry') {
      return base
    }
    return `${base} • ${participantName}`
  }

  /**
   * Copy payment details to clipboard for easy pasting into a payment app.
   */
  async function copyPaymentDetails(
    provider: string,
    handle: string,
    amountDollars: number,
    note: string,
  ) {
    const text = `${provider}: ${handle}\nAmount: $${formatAmount(amountDollars)}\nNote: ${note}`
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  return {
    buildLinks,
    buildPaymentNote,
    copyPaymentDetails,
  }
}
