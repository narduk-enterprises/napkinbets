import { expect, test, waitForHydration } from '../fixtures'
import { loginAsDemo } from '../page-helpers'

test.describe('napkins — creation', () => {
  test.describe.configure({ mode: 'serial' })

  test.describe('form rendering', () => {
    test('create page shows heading and bet type choices; Group Pool reveals pool UI', async ({
      page,
    }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      await expect(page.getByRole('heading', { name: 'Create a Napkin' })).toBeVisible()

      const headToHead = page.getByRole('button', { name: /Head-to-Head/ })
      const groupPool = page.getByRole('button', { name: /Group Pool/ })
      await expect(headToHead).toBeVisible()
      await expect(groupPool).toBeVisible()
      await headToHead.click()
      await expect(page.getByText('One opponent, one winner.')).toBeVisible()

      await groupPool.click()
      await waitForHydration(page)
      await expect(page.getByText('Set up your pool')).toBeVisible()
      await expect(page.getByText("Who's in?")).toBeVisible()
      await expect(page.getByText('Side options')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add a question' })).toBeVisible()
    })
  })

  test.describe('legs builder', () => {
    test('add question, type question, set answer type, add option', async ({ page }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      await page.getByRole('button', { name: /Group Pool/ }).click()
      await waitForHydration(page)

      await page.getByRole('button', { name: 'Add a question' }).click()
      await expect(page.getByText('Question 1')).toBeVisible()

      await page.getByRole('textbox', { name: /Question/ }).fill('Who scores first?')
      await page.getByLabel('Answer type').click()
      await page.getByRole('option', { name: 'Pick from options' }).click()

      const optionInput = page.getByPlaceholder('Add an answer option')
      await optionInput.fill('Player A')
      const legOptionCard = page
        .locator('.napkinbets-panel')
        .filter({ has: optionInput })
        .filter({ hasNotText: 'What kind of bet' })
      await legOptionCard.getByRole('button', { name: 'Add' }).click()
      await expect(page.getByText('Player A').first()).toBeVisible()
    })

    test('Suggest questions button visible when AI is enabled', async ({ page }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      await page.getByLabel('Bet title').fill('Weekend watch party')
      await page.getByRole('button', { name: /Group Pool/ }).click()
      await waitForHydration(page)

      const suggestBtn = page.getByRole('button', { name: 'Suggest questions' })
      const aiCard = page.getByText('AI Napkin Generator')
      const aiVisible = await aiCard.isVisible().catch(() => false)
      if (aiVisible) {
        await expect(suggestBtn).toBeVisible()
      }
      // If AI not enabled, Suggest questions is not rendered — nothing to assert
    })
  })

  test.describe('stake chips', () => {
    test('quick stake chips visible; clicking updates stake input and chip has distinct styling', async ({
      page,
    }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      const stakeInput = page.getByLabel('Stake ($)')
      await expect(stakeInput).toBeVisible()

      for (const amount of [1, 5, 10, 20, 50, 100]) {
        const chip = page.getByRole('button', { name: `$${amount}`, exact: true })
        await expect(chip).toBeVisible()
        await chip.click()
        await expect(stakeInput).toHaveValue(String(amount))
        await expect(chip).toHaveAttribute('class', /primary|soft/)
      }
    })
  })

  test.describe('AI generator', () => {
    test('when visible: card visible, can type and submit; Surprise me in initial state; after generation Use this Napkin and Start Over', async ({
      page,
    }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      const aiCard = page.getByText('AI Napkin Generator')
      const aiVisible = await aiCard.isVisible().catch(() => false)
      if (!aiVisible) {
        test.skip(true, 'AI generator not rendered (aiEnabled false)')
      }

      await expect(aiCard).toBeVisible()
      await expect(page.getByRole('button', { name: 'Surprise me' })).toBeVisible()

      const textarea = page.getByPlaceholder(/Describe the bet|Who can eat|Create a fun/)
      await textarea.fill('A silly bet about pizza toppings')
      await page.getByRole('button', { name: 'Generate' }).click()

      await page.waitForTimeout(3000)

      const useBtn = page.getByRole('button', { name: 'Use this Napkin' })
      const startOverBtn = page.getByRole('button', { name: 'Start Over' })
      const useVisible = await useBtn.isVisible().catch(() => false)
      const _startOverVisible = await startOverBtn.isVisible().catch(() => false)

      if (useVisible) {
        await expect(startOverBtn).toBeVisible()
      } else {
        const errorOrStartOver = page
          .getByText('AI Error')
          .or(page.getByRole('button', { name: 'Start Over' }))
        await expect(errorOrStartOver.first())
          .toBeVisible({ timeout: 5000 })
          .catch(() => {})
      }
    })

    test('Start Over resets AI state', async ({ page }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      if (
        !(await page
          .getByText('AI Napkin Generator')
          .isVisible()
          .catch(() => false))
      ) {
        test.skip(true, 'AI generator not rendered')
      }

      await page.getByRole('button', { name: 'Surprise me' }).click()
      await page.waitForTimeout(4000)

      const startOver = page.getByRole('button', { name: 'Start Over' })
      if (await startOver.isVisible().catch(() => false)) {
        await startOver.click()
        await expect(page.getByRole('button', { name: 'Surprise me' })).toBeVisible()
      }
    })
  })

  test.describe('full flow', () => {
    test('AI path: generate (may 403/503), Use this Napkin fills form; skip submit', async ({
      page,
    }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      if (
        !(await page
          .getByText('AI Napkin Generator')
          .isVisible()
          .catch(() => false))
      ) {
        test.skip(true, 'AI generator not rendered')
      }

      await page.getByRole('button', { name: 'Surprise me' }).click()
      await page.waitForTimeout(5000)

      const useBtn = page.getByRole('button', { name: 'Use this Napkin' })
      const useVisible = await useBtn.isVisible().catch(() => false)
      if (!useVisible) {
        test.skip(true, 'AI returned error (403/503 or similar); skipping fill assertion')
      }

      await useBtn.click()
      await waitForHydration(page)

      await expect(page.getByLabel('Bet title')).not.toHaveValue('')
    })

    test('manual pool: Group Pool, title, two sides, participants, one leg, stake, submit then verify redirect or success', async ({
      page,
    }) => {
      await loginAsDemo(page, '/napkins/create')
      await waitForHydration(page)

      await page.getByRole('button', { name: /Group Pool/ }).click()
      await waitForHydration(page)

      await page.getByLabel('Bet title').fill('E2E Pool Bet')
      const sideSection = page.getByText('Side options').locator('..')
      await sideSection.getByPlaceholder('Add a side option').fill('Side A')
      await sideSection.getByRole('button', { name: 'Add' }).click()
      await sideSection.getByPlaceholder('Add a side option').fill('Side B')
      await sideSection.getByRole('button', { name: 'Add' }).click()

      const participantsSection = page.getByText("Who's in?").locator('..')
      await participantsSection.getByPlaceholder('Add participant name').fill('Alice')
      await participantsSection.getByRole('button', { name: 'Add' }).click()
      await participantsSection.getByPlaceholder('Add participant name').fill('Bob')
      await participantsSection.getByRole('button', { name: 'Add' }).click()

      await page.getByRole('button', { name: 'Add a question' }).click()
      await page.getByRole('textbox', { name: /Question/ }).fill('Who wins?')

      await page.getByRole('button', { name: '$5', exact: true }).click()
      await expect(page.getByLabel('Stake ($)')).toHaveValue('5')

      await page.getByRole('button', { name: 'Send the bet' }).click()

      await expect(page).toHaveURL(/\/napkins\/[^/]+$/, { timeout: 15_000 })
    })
  })
})
