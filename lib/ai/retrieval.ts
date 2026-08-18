/**
 * retrieval.ts
 *
 * Re-exports the primary vector search function under the name used by the
 * API route, and provides the RetrievedFeedback type alias.
 *
 * All retrieval logic lives in vectorSearch.ts.
 */

export type { VectorSearchResult as RetrievedFeedback } from "./vectorSearch";
export { vectorSearch as retrieveTopFeedback } from "./vectorSearch";
