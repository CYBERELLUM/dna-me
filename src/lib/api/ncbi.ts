// NCBI E-utilities API - Free public API for genomic data
// No API key required for low-volume requests (< 3 requests/second)
// https://www.ncbi.nlm.nih.gov/books/NBK25500/

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export interface PubMedArticle {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi: string;
  pmid: string;
}

export interface GeneInfo {
  id: string;
  symbol: string;
  name: string;
  organism: string;
  summary: string;
  chromosome: string;
  location: string;
}

export interface SequenceInfo {
  id: string;
  accession: string;
  title: string;
  organism: string;
  length: number;
  type: string;
}

// Search PubMed for genomics articles
export async function searchPubMed(query: string, maxResults = 20): Promise<PubMedArticle[]> {
  try {
    // First, search for IDs
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query + ' AND genomics[MeSH]')}&retmax=${maxResults}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    // Fetch article details
    const fetchUrl = `${BASE_URL}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

// Search NCBI Gene database
export async function searchGenes(query: string, maxResults = 20): Promise<GeneInfo[]> {
  try {
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=gene&term=${encodeURIComponent(query)}[Gene Name] AND human[Organism]&retmax=${maxResults}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const summaryUrl = `${BASE_URL}/esummary.fcgi?db=gene&id=${ids.join(',')}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    return parseGeneSummary(summaryData);
  } catch (error) {
    console.error('Gene search error:', error);
    return [];
  }
}

// Search nucleotide sequences
export async function searchSequences(query: string, maxResults = 20): Promise<SequenceInfo[]> {
  try {
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=nucleotide&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const summaryUrl = `${BASE_URL}/esummary.fcgi?db=nucleotide&id=${ids.join(',')}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    return parseSequenceSummary(summaryData);
  } catch (error) {
    console.error('Sequence search error:', error);
    return [];
  }
}

// Parse PubMed XML response
function parsePubMedXML(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  
  const articleNodes = doc.querySelectorAll('PubmedArticle');
  
  articleNodes.forEach((node) => {
    const pmid = node.querySelector('PMID')?.textContent || '';
    const title = node.querySelector('ArticleTitle')?.textContent || 'No title';
    const abstractText = node.querySelector('AbstractText')?.textContent || '';
    const journal = node.querySelector('Journal Title')?.textContent || 
                    node.querySelector('ISOAbbreviation')?.textContent || '';
    const year = node.querySelector('PubDate Year')?.textContent || 
                 node.querySelector('PubDate MedlineDate')?.textContent?.slice(0, 4) || '';
    
    // Get authors
    const authorNodes = node.querySelectorAll('Author');
    const authors: string[] = [];
    authorNodes.forEach((author, i) => {
      if (i < 3) {
        const lastName = author.querySelector('LastName')?.textContent || '';
        const initials = author.querySelector('Initials')?.textContent || '';
        if (lastName) authors.push(`${lastName} ${initials}`);
      }
    });
    if (authorNodes.length > 3) authors.push('et al.');
    
    // Get DOI
    const articleIdNodes = node.querySelectorAll('ArticleId');
    let doi = '';
    articleIdNodes.forEach((idNode) => {
      if (idNode.getAttribute('IdType') === 'doi') {
        doi = idNode.textContent || '';
      }
    });
    
    articles.push({
      id: pmid,
      pmid,
      title,
      authors: authors.join(', ') || 'Unknown authors',
      journal: journal || 'Unknown journal',
      year: year || 'Unknown',
      abstract: abstractText || 'No abstract available.',
      doi,
    });
  });
  
  return articles;
}

// Parse Gene summary response
function parseGeneSummary(data: any): GeneInfo[] {
  const genes: GeneInfo[] = [];
  const result = data.result || {};
  const uids = result.uids || [];
  
  uids.forEach((uid: string) => {
    const gene = result[uid];
    if (gene) {
      genes.push({
        id: uid,
        symbol: gene.name || gene.symbol || 'N/A',
        name: gene.description || gene.nomenclaturename || 'No description',
        organism: gene.organism?.scientificname || 'Unknown',
        summary: gene.summary || 'No summary available.',
        chromosome: gene.chromosome || 'N/A',
        location: gene.maplocation || gene.locationhist || 'Unknown location',
      });
    }
  });
  
  return genes;
}

// Parse Sequence summary response
function parseSequenceSummary(data: any): SequenceInfo[] {
  const sequences: SequenceInfo[] = [];
  const result = data.result || {};
  const uids = result.uids || [];
  
  uids.forEach((uid: string) => {
    const seq = result[uid];
    if (seq) {
      sequences.push({
        id: uid,
        accession: seq.accessionversion || seq.caption || 'N/A',
        title: seq.title || 'No title',
        organism: seq.organism || 'Unknown organism',
        length: seq.slen || 0,
        type: seq.moltype || seq.biomol || 'DNA',
      });
    }
  });
  
  return sequences;
}
