function sanitizeHandle(handle: string) {
  return handle.trim().replace(/^@/, '').replace(/^\$/, '')
}

function formatAmount(amountDollars: number) {
  return amountDollars.toFixed(2)
}

export interface NapkinbetsPaymentLink {
  label: string
  href: string
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
          })
        }
        break
      case 'Venmo':
        if (safeHandle) {
          links.push({
            label: 'Open Venmo profile',
            href: `https://venmo.com/u/${safeHandle}`,
          })
          links.push({
            label: 'Open Venmo app',
            href: `venmo://paycharge?txn=pay&recipients=${encodeURIComponent(safeHandle)}&amount=${safeAmount}&note=${safeNote}`,
          })
        }
        break
      case 'Cash App':
        if (safeHandle) {
          links.push({
            label: 'Open Cash App',
            href: `https://cash.app/$${safeHandle}`,
          })
        }
        break
      case 'Zelle':
        links.push({
          label: 'Open Zelle',
          href: 'https://www.zellepay.com/',
        })
        break
    }

    return links
  }

  function buildPaymentNote(wagerSlug: string, participantName: string, amountDollars: number) {
    return `NB ${wagerSlug} • entry $${formatAmount(amountDollars)} • ${participantName}`
  }

  return {
    buildLinks,
    buildPaymentNote,
  }
}
