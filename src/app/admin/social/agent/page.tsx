'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Bot, TrendingUp, Video, BarChart3, Target, Lightbulb, Send, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { PageHeader } from '@/components/admin/PageHeader'

type Tab = 'trends' | 'videos' | 'ads' | 'insights' | 'strategy'

export default function SocialAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('trends')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Record<string, any>>({})
  const { ta } = useAdminTranslate()

  const [niche, setNiche] = useState('jewelry, accessories, fashion')
  const [region, setRegion] = useState('egypt')

  const [productName, setProductName] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productMaterial, setProductMaterial] = useState('')
  const [productDesc, setProductDesc] = useState('')
  const [videoCount, setVideoCount] = useState(3)

  const [adGoal, setAdGoal] = useState('sales')
  const [adBudget, setAdBudget] = useState('5000')
  const [adTarget, setAdTarget] = useState('women 18-45 Egypt')

  const callAgent = useCallback(async (action: string, params: any) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/social/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)
      setResults(prev => ({ ...prev, [action]: data.data }))
      toast.success(ta('Analysis complete'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : ta('Request failed'))
    } finally {
      setLoading(false)
    }
  }, [])

  const tabs = [
    { id: 'trends' as Tab, label: ta('Trend Analysis'), icon: TrendingUp },
    { id: 'videos' as Tab, label: ta('Video Ideas'), icon: Video },
    { id: 'ads' as Tab, label: ta('Ad Manager'), icon: Target },
    { id: 'insights' as Tab, label: ta('Analytics Insights'), icon: BarChart3 },
    { id: 'strategy' as Tab, label: ta('Content Strategy'), icon: Lightbulb },
  ]

  return (
    <div>
      <PageHeader
        title={ta('AI Social Media Agent')}
        subtitle={ta('Your intelligent brand manager for Instagram & Facebook')}
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-gold" />
            <span>{ta('Powered by GROQ AI')}</span>
          </div>
        }
      />

      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'text-navy border-b-2 border-navy' : 'text-muted-foreground hover:text-navy'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'trends' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-navy mb-4">{ta('Trend Analysis')}</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Niche / Industry')}</label>
                <input value={niche} onChange={e => setNiche(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Region')}</label>
                <select value={region} onChange={e => setRegion(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm">
                  <option value="egypt">{ta('Egypt')}</option>
                  <option value="gulf">{ta('Gulf')}</option>
                  <option value="global">{ta('Global')}</option>
                </select>
              </div>
            </div>
            <button onClick={() => callAgent('analyze-trends', { niche, region })} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
              {loading ? ta('Analyzing...') : ta('Analyze Trends')}
            </button>
          </div>

          {results['analyze-trends'] && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {results['analyze-trends'].trends?.map((t: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-border p-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-navy">{t.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          t.momentum === 'rising' ? 'bg-green-50 text-green-700' :
                          t.momentum === 'declining' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-600'
                        }`}>{t.momentum}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          t.relevance === 'high' ? 'bg-gold/10 text-gold' :
                          'bg-gray-50 text-gray-500'
                        }`}>{t.relevance} {ta('relevance')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{t.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="font-semibold text-navy mb-2">{ta('Niche Insights')}</h4>
                <p className="text-sm text-muted-foreground mb-4">{results['analyze-trends'].nicheInsights}</p>
                <h4 className="font-semibold text-navy mb-2">{ta('Recommended Actions')}</h4>
                <ul className="space-y-2">
                  {results['analyze-trends'].recommendedActions?.map((a: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-gold mt-0.5">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'videos' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-navy mb-4">{ta('Video Content Suggestions')}</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Product Name')}</label>
                <input value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder={ta('e.g. Solstice Necklace')} />
              </div>
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Price (EGP)')}</label>
                <input value={productPrice} onChange={e => setProductPrice(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder={ta('e.g. 450')} />
              </div>
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Material')}</label>
                <input value={productMaterial} onChange={e => setProductMaterial(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder={ta('e.g. Stainless Steel')} />
              </div>
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Number of Ideas')}</label>
                <input type="number" min={1} max={5} value={videoCount} onChange={e => setVideoCount(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-navy block mb-1">{ta('Description')}</label>
              <textarea value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-border text-sm resize-none" placeholder={ta('Describe the product...')} />
            </div>
            <button onClick={() => callAgent('suggest-videos', { product: { name: productName, price: Number(productPrice), material: productMaterial, description: productDesc }, count: videoCount })} disabled={loading || !productName} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
              {loading ? ta('Generating...') : ta('Generate Video Ideas')}
            </button>
          </div>

          {results['suggest-videos'] && (
            <div className="space-y-4">
              {Array.isArray(results['suggest-videos']) && results['suggest-videos'].map((v: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-border p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-navy text-lg">{v.title}</h4>
                    <span className="px-2 py-0.5 bg-gold/10 text-gold rounded text-xs font-medium">{v.duration}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{v.concept}</p>
                  <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">🎯 {ta('Hook')}</p>
                    <p className="text-sm font-medium text-navy">{v.hook}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-2">📋 {ta('Structure')}</p>
                    <div className="flex flex-wrap gap-2">
                      {v.structure?.map((s: string, j: number) => (
                        <span key={j} className="px-2 py-1 bg-navy/5 text-navy rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-muted-foreground mb-1">🎵 {v.musicStyle}</p>
                  </div>
                  <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">📝 {ta('Caption')}</p>
                    <p className="text-sm text-navy">{v.caption}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {v.hashtags?.map((h: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{h}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'ads' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-navy mb-4">{ta('Ad Campaign Recommendations')}</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Campaign Goal')}</label>
                <select value={adGoal} onChange={e => setAdGoal(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm">
                  <option value="awareness">{ta('Brand Awareness')}</option>
                  <option value="engagement">{ta('Engagement')}</option>
                  <option value="sales">{ta('Sales / Conversions')}</option>
                  <option value="followers">{ta('Followers Growth')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-navy block mb-1">{ta('Budget (EGP)')}</label>
                <input value={adBudget} onChange={e => setAdBudget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-navy block mb-1">{ta('Target Audience')}</label>
              <input value={adTarget} onChange={e => setAdTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder={ta('e.g. women 18-45 Egypt interested in fashion')} />
            </div>
            <button onClick={() => callAgent('recommend-ads', { goal: adGoal, budget: Number(adBudget), target: adTarget })} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
              {loading ? ta('Generating...') : ta('Get Recommendations')}
            </button>
          </div>

          {results['recommend-ads'] && (
            <div className="space-y-4">
              {Array.isArray(results['recommend-ads']) && results['recommend-ads'].map((campaign: any, i: number) => (
                <div key={i} className="bg-white rounded-xl border border-border p-5">
                  <h4 className="font-semibold text-navy text-lg mb-2">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{campaign.objective}</p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-3">
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">💰 {ta('Budget')}</p>
                      <p className="text-sm font-medium text-navy">{campaign.budgetSuggestion}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">🎯 {ta('Reach')}</p>
                      <p className="text-sm font-medium text-navy">{campaign.estimatedReach}</p>
                    </div>
                  </div>
                  {campaign.targeting && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">{ta('Targeting')}</p>
                      <div className="flex flex-wrap gap-2">
                        {campaign.targeting.ageRange && <span className="px-2 py-1 bg-navy/5 text-navy rounded text-xs">{ta('Age')}: {campaign.targeting.ageRange}</span>}
                        {campaign.targeting.gender && <span className="px-2 py-1 bg-navy/5 text-navy rounded text-xs">{ta('Gender')}: {campaign.targeting.gender}</span>}
                        {Array.isArray(campaign.targeting.interests) && campaign.targeting.interests.map((int: string, j: number) => (
                          <span key={j} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">{int}</span>
                        ))}
                        {Array.isArray(campaign.targeting.locations) && campaign.targeting.locations.map((loc: string, j: number) => (
                          <span key={j} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">{loc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="bg-secondary/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">{ta('Creative Strategy')}</p>
                    <p className="text-sm text-navy">{campaign.creativeStrategy}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {campaign.platforms?.map((p: string, j: number) => (
                      <span key={j} className="px-2 py-0.5 bg-gold/10 text-gold rounded text-xs font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'insights' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-navy mb-4">{ta('Analytics Insights')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{ta('Generate AI-powered insights from your social media performance data.')}</p>
            <button onClick={() => callAgent('generate-insights', {})} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? ta('Analyzing...') : ta('Generate Insights')}
            </button>
          </div>

          {results['generate-insights'] && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="font-semibold text-navy mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-gold" /> {ta('Key Findings')}</h4>
                <ul className="space-y-2">
                  {results['generate-insights'].findings?.map((f: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-gold mt-0.5">•</span>{f}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="font-semibold text-navy mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-gold" /> {ta('Opportunities')}</h4>
                <ul className="space-y-2">
                  {results['generate-insights'].opportunities?.map((o: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>{o}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">⚠ {ta('Risks')}</h4>
                <ul className="space-y-2">
                  {results['generate-insights'].risks?.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-red-500 mt-0.5">•</span>{r}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">✅ {ta('Recommended Actions')}</h4>
                <ul className="space-y-2">
                  {results['generate-insights'].actions?.map((a: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-gold mt-0.5">•</span>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'strategy' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="font-semibold text-navy mb-4">{ta('Content Strategy Generator')}</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-navy block mb-1">{ta('Products (comma-separated)')}</label>
              <input value={productName} onChange={e => setProductName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder={ta('e.g. Solstice Necklace, Stackable Rings, Gift Sets')} />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-navy block mb-1">{ta('Goals')}</label>
              <input value={adTarget} onChange={e => setAdTarget(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder={ta('e.g. increase engagement, drive sales, build brand awareness')} />
            </div>
            <button onClick={() => callAgent('content-strategy', { products: productName.split(',').map(s => s.trim()), goals: adTarget })} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              {loading ? ta('Generating...') : ta('Generate Strategy')}
            </button>
          </div>

          {results['content-strategy'] && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="font-semibold text-navy mb-2">{ta('Strategy Overview')}</h4>
                <p className="text-sm text-muted-foreground">{results['content-strategy'].overview}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {results['content-strategy'].pillars?.map((p: any, i: number) => (
                  <div key={i} className="bg-white rounded-xl border border-border p-4">
                    <h4 className="font-semibold text-navy mb-1">{p.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{p.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.postTypes?.map((pt: string, j: number) => (
                        <span key={j} className="px-2 py-0.5 bg-gold/10 text-gold rounded text-xs">{pt}</span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{p.frequency}</span>
                  </div>
                ))}
              </div>
              {results['content-strategy'].weeklyPlan?.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h4 className="font-semibold text-navy mb-3">{ta('Weekly Plan')}</h4>
                  <ul className="space-y-2">
                    {results['content-strategy'].weeklyPlan.map((w: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-gold mt-0.5">•</span>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results['content-strategy'].metrics?.length > 0 && (
                <div className="bg-white rounded-xl border border-border p-5">
                  <h4 className="font-semibold text-navy mb-3">{ta('KPIs to Track')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {results['content-strategy'].metrics.map((m: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-navy/5 text-navy rounded-lg text-sm">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
