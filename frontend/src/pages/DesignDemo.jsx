/**
 * Design Demo Page - Compare all 3 design options
 * Navigate to /design-demo to see this page
 */

import { EpisodeCardMinimal, EpisodeCardModern, EpisodeCardPremium } from '../components/EpisodeCard'

const sampleEpisode = {
  guid: 'demo-1',
  id: 1,
  title: 'Why You Always Want More, And How To Fix It | Michael Easter',
  published: '2025-11-26T01:09:36',
  duration_formatted: '45:30',
  description: 'Learning how to thrive with enough. Michael Easter is the New York Times bestselling author of Scarcity Brain and The Comfort Crisis. He also shares his ideas on his popular newsletter, 2% with Michael Easter.',
  status: 'new'
}

const completedEpisode = {
  ...sampleEpisode,
  guid: 'demo-2',
  id: 2,
  title: 'A Radical Buddhist Antidote for Anxiety | John Makransky and Paul Condon',
  status: 'completed'
}

const processingEpisode = {
  ...sampleEpisode,
  guid: 'demo-3',
  id: 3,
  title: 'The Dharma of Anxiety and Depression | Leslie Booker',
  status: 'transcribing'
}

export default function DesignDemo() {
  const handleProcess = () => console.log('Process clicked')
  const handleView = () => console.log('View clicked')

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎨 Design Comparison
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            See all three design options side-by-side
          </p>
          <p className="text-sm text-gray-500">
            Currently using: <span className="font-semibold text-primary-600">Option 2 (Modern)</span>
          </p>
        </div>

        {/* Option 1: Minimal */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Option 1: Minimal/Clean
            </h2>
            <p className="text-gray-600">
              Inspired by Linear, Notion • Professional, spacious design
            </p>
          </div>
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200">
            <EpisodeCardMinimal episode={sampleEpisode} onProcess={handleProcess} onView={handleView} />
            <EpisodeCardMinimal episode={completedEpisode} onProcess={handleProcess} onView={handleView} />
            <EpisodeCardMinimal episode={processingEpisode} onProcess={handleProcess} onView={handleView} />
          </div>
        </section>

        {/* Option 2: Modern */}
        <section className="mb-16">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Option 2: Modern/Card-based
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                ⭐ RECOMMENDED
              </span>
            </div>
            <p className="text-gray-600">
              Inspired by Spotify, Stripe • Balanced, colorful, modern
            </p>
          </div>
          <div className="space-y-4 bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-primary-300">
            <EpisodeCardModern episode={sampleEpisode} onProcess={handleProcess} onView={handleView} />
            <EpisodeCardModern episode={completedEpisode} onProcess={handleProcess} onView={handleView} />
            <EpisodeCardModern episode={processingEpisode} onProcess={handleProcess} onView={handleView} />
          </div>
        </section>

        {/* Option 3: Premium */}
        <section className="mb-16">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Option 3: Premium/Glassmorphism
            </h2>
            <p className="text-gray-600">
              Inspired by Apple, Figma • Refined, elegant, premium
            </p>
          </div>
          <div className="space-y-4 bg-white p-6 rounded-xl border-2 border-gray-200">
            <EpisodeCardPremium episode={sampleEpisode} onProcess={handleProcess} onView={handleView} />
            <EpisodeCardPremium episode={completedEpisode} onProcess={handleProcess} onView={handleView} />
            <EpisodeCardPremium episode={processingEpisode} onProcess={handleProcess} onView={handleView} />
          </div>
        </section>

        {/* Instructions */}
        <section className="bg-primary-50 border border-primary-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            💡 How to Switch Designs
          </h3>
          <p className="text-gray-700 mb-4">
            To change the design across your app, update the import in <code className="px-2 py-1 bg-white rounded text-sm">PodcastEpisodes.jsx</code>:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`// Option 1
import { EpisodeCardMinimal } from '../components/EpisodeCard'
<EpisodeCardMinimal ... />

// Option 2 (Current)
import { EpisodeCardModern } from '../components/EpisodeCard'
<EpisodeCardModern ... />

// Option 3
import { EpisodeCardPremium } from '../components/EpisodeCard'
<EpisodeCardPremium ... />`}
          </pre>
        </section>
      </div>
    </div>
  )
}



