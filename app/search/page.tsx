import {SearchResults} from './search-results'

export default async function SearchPage({searchParams}: {searchParams: Promise<{q?: string}>}) {
  const params = await searchParams
  return <main className="search-page"><SearchResults initialQuery={params.q || ''} /></main>
}
