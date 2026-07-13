import { describe, it, expect } from 'vitest'

describe('enhanceImage prompt builder', () => {
  it('builds correct prompt for ring', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Silver Ring', 'ring')
    expect(prompt).toBe(
      'Professional product photography of a Silver Ring, on a white marble surface with soft studio lighting, jewelry macro photography, 8K'
    )
  })

  it('builds correct prompt for necklace', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Gold Chain Necklace', 'necklace')
    expect(prompt).toBe(
      'Professional product photography of a Gold Chain Necklace, on a velvet display bust with soft studio lighting, jewelry photography, 8K'
    )
  })

  it('builds correct prompt for bracelet', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Silver Bracelet', 'bracelet')
    expect(prompt).toBe(
      'Professional product photography of a Silver Bracelet, on a clean white surface with natural lighting, jewelry photography, 8K'
    )
  })

  it('builds correct prompt for earrings', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Gold Earrings', 'earrings')
    expect(prompt).toBe(
      'Professional product photography of a Gold Earrings, on a minimalist display stand with soft studio lighting, jewelry photography, 8K'
    )
  })

  it('falls back to other for unknown type', async () => {
    const { buildPrompt } = await import('./enhance-image')
    const prompt = buildPrompt('Watch', 'unknown')
    expect(prompt).toBe(
      'Professional product photography of a Watch, professional studio lighting, clean background, commercial product photography, 8K'
    )
  })

  it('rejects when HF_API_KEY is not set', async () => {
    const { enhanceImage } = await import('./enhance-image')
    await expect(enhanceImage(
      Buffer.from('fake-image'),
      'Ring',
      'ring',
      'Custom prompt here'
    )).rejects.toThrow('HF_API_KEY not set')
  })
})
