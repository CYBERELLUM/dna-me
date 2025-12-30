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

// Longevity-specific interfaces
export interface EpigeneticMarker {
  id: string;
  gene: string;
  marker: string;
  type: 'methylation' | 'histone' | 'chromatin';
  effect: string;
  relevance: string;
}

export interface LongevityGene {
  id: string;
  symbol: string;
  name: string;
  pathway: string;
  function: string;
  ageEffect: string;
  interventions: string[];
}

export interface NutrigenomicInteraction {
  id: string;
  gene: string;
  nutrient: string;
  effect: string;
  recommendation: string;
  evidence: string;
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

// === LONGEVITY BIOTECH SPECIALIZED SEARCHES ===

// Search for epigenetics and methylation research
export async function searchEpigenetics(query: string, maxResults = 20): Promise<PubMedArticle[]> {
  try {
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      `(${query}) AND (epigenetics[MeSH] OR DNA methylation[MeSH] OR histone modification[MeSH] OR chromatin[MeSH])`
    )}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const fetchUrl = `${BASE_URL}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error('Epigenetics search error:', error);
    return [];
  }
}

// Search for longevity and aging genes
export async function searchLongevityGenes(query: string, maxResults = 20): Promise<GeneInfo[]> {
  try {
    const longevityTerms = 'longevity OR aging OR senescence OR lifespan OR telomere';
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=gene&term=${encodeURIComponent(
      `(${query} OR ${longevityTerms}) AND human[Organism]`
    )}&retmax=${maxResults}&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const summaryUrl = `${BASE_URL}/esummary.fcgi?db=gene&id=${ids.join(',')}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    return parseGeneSummary(summaryData);
  } catch (error) {
    console.error('Longevity genes search error:', error);
    return [];
  }
}

// Search for nutrigenomics research
export async function searchNutrigenomics(query: string, maxResults = 20): Promise<PubMedArticle[]> {
  try {
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      `(${query}) AND (nutrigenomics[MeSH] OR gene expression[MeSH] OR dietary nutrients[MeSH] OR nutritional genomics)`
    )}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const fetchUrl = `${BASE_URL}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error('Nutrigenomics search error:', error);
    return [];
  }
}

// Search for cellular aging and senescence research
export async function searchCellularAging(query: string, maxResults = 20): Promise<PubMedArticle[]> {
  try {
    const searchUrl = `${BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      `(${query}) AND (cellular senescence[MeSH] OR cellular aging[MeSH] OR telomere[MeSH] OR autophagy[MeSH] OR mitochondria[MeSH])`
    )}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) return [];
    
    const fetchUrl = `${BASE_URL}/efetch.fcgi?db=pubmed&id=${ids.join(',')}&rettype=abstract&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    
    return parsePubMedXML(xmlText);
  } catch (error) {
    console.error('Cellular aging search error:', error);
    return [];
  }
}

// Curated longevity gene clusters (based on published research)
export const LONGEVITY_GENE_CLUSTERS = [
  {
    cluster: 'Telomere Maintenance',
    genes: ['TERT', 'TERC', 'DKC1', 'TINF2', 'POT1'],
    description: 'Genes involved in telomere length regulation and chromosomal stability'
  },
  {
    cluster: 'Sirtuin Pathway',
    genes: ['SIRT1', 'SIRT3', 'SIRT6', 'NAMPT', 'PARP1'],
    description: 'NAD+-dependent deacetylases linked to metabolism and aging'
  },
  {
    cluster: 'mTOR Signaling',
    genes: ['MTOR', 'RPTOR', 'RICTOR', 'TSC1', 'TSC2'],
    description: 'Nutrient sensing pathway regulating cell growth and autophagy'
  },
  {
    cluster: 'AMPK Pathway',
    genes: ['PRKAA1', 'PRKAA2', 'STK11', 'ADIPOQ', 'PPARGC1A'],
    description: 'Energy sensor pathway activated by caloric restriction'
  },
  {
    cluster: 'Insulin/IGF-1 Signaling',
    genes: ['IGF1', 'IGF1R', 'FOXO1', 'FOXO3', 'IRS1'],
    description: 'Growth factor signaling pathway strongly linked to lifespan'
  },
  {
    cluster: 'DNA Repair',
    genes: ['TP53', 'BRCA1', 'BRCA2', 'ATM', 'WRN'],
    description: 'Genome stability and DNA damage response genes'
  },
  {
    cluster: 'Oxidative Stress Response',
    genes: ['SOD1', 'SOD2', 'CAT', 'GPX1', 'NFE2L2'],
    description: 'Antioxidant defense and cellular protection'
  },
  {
    cluster: 'Epigenetic Regulation',
    genes: ['DNMT1', 'DNMT3A', 'TET2', 'HDAC1', 'KAT2A'],
    description: 'DNA methylation and chromatin modification enzymes'
  }
];

// Key nutrients for nutrigenomics
export const NUTRIGENOMIC_COMPOUNDS = [
  { name: 'Resveratrol', target: 'SIRT1', effect: 'Activates sirtuin pathway', sources: 'Grapes, berries, peanuts' },
  { name: 'NAD+ Precursors', target: 'NAMPT/SIRT', effect: 'Boosts NAD+ levels', sources: 'NMN, NR supplements' },
  { name: 'Sulforaphane', target: 'NRF2', effect: 'Activates antioxidant response', sources: 'Broccoli, cruciferous vegetables' },
  { name: 'Curcumin', target: 'NF-κB', effect: 'Reduces inflammation', sources: 'Turmeric' },
  { name: 'Quercetin', target: 'Senescent cells', effect: 'Senolytic activity', sources: 'Onions, apples, berries' },
  { name: 'Spermidine', target: 'Autophagy', effect: 'Promotes cellular cleanup', sources: 'Wheat germ, aged cheese' },
  { name: 'Omega-3 Fatty Acids', target: 'Inflammation', effect: 'Telomere protection', sources: 'Fish, flaxseed, walnuts' },
  { name: 'Vitamin D', target: 'VDR gene', effect: 'Immune and bone health', sources: 'Sunlight, fortified foods, fish' }
];
