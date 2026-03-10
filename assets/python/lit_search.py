import os
import requests as rq
from itertools import combinations 
import rispy
import time
import pandas as pd
import xmltodict
import datetime
import xml.etree.ElementTree as ET
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from matplotlib_venn import venn3
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import datetime
import os
import rasterio as rio
from wordcloud import WordCloud, STOPWORDS
import seaborn as sns
import networkx as nx
from sklearn.feature_extraction.text import CountVectorizer
# from util import funfuns as ffs
# Ensure download folder exists
non_us_locations = '("PEOPLES R CHINA" OR "CANADA" OR "ENGLAND" OR "AUSTRALIA" OR "SPAIN" OR "FRANCE" OR "GERMANY" OR "BRAZIL" OR "JAPAN" OR "ITALY" OR "SWITZERLAND" OR "SOUTH KOREA" OR "MEXICO" OR "INDIA" OR "NETHERLANDS" OR "ISRAEL" OR "TAIWAN" OR "SWEDEN" OR "NEW ZEALAND" OR "FINLAND" OR "IRAN" OR "SCOTLAND" OR "ARGENTINA" OR "NORWAY" OR "BELGIUM" OR "PAKISTAN" OR "SOUTH AFRICA" OR "CHILE" OR "PHILIPPINES" OR "SAUDI ARABIA" OR "THAILAND" OR "VIETNAM" OR "AUSTRIA" OR "BANGLADESH" OR "INDONESIA" OR "PORTUGAL" OR "RUSSIA" OR "SINGAPORE" OR "COLOMBIA" OR "CYPRUS" OR "CZECH REPUBLIC" OR "DENMARK" OR "EGYPT" OR "GREECE" OR "IRELAND" OR "ALGERIA" OR "ETHIOPIA" OR "IRAQ" OR "NEPAL" OR "NIGERIA" OR "PANAMA" OR "PERU" OR "SERBIA" OR "TURKEY" OR "U ARAB EMIRATES" OR "BOLIVIA" OR "CAMEROON" OR "GEORGIA" OR "GHANA" OR "KENYA" OR "MALAYSIA" OR "MOLDOVA" OR "QATAR" OR "ROMANIA" OR "TURKIYE" OR "WALES" OR "ARMENIA" OR "COSTA RICA" OR "DEM REP CONGO" OR "DOMINICA" OR "HAITI" OR "JORDAN" OR "NICARAGUA" OR "POLAND" OR "SLOVAKIA" OR "SLOVENIA" OR "SRI LANKA" OR "BELARUS" OR "BOSNIA HERCEG" OR "BOTSWANA" OR "COTE IVOIRE" OR "ECUADOR" OR "ESTONIA" OR "FIJI" OR "FRENCH GUIANA" OR "ICELAND" OR "KYRGYZSTAN" OR "LEBANON" OR "LIBERIA" OR "LUXEMBOURG" OR "MONGOLIA" OR "MOROCCO" OR "OMAN" OR "PAPUA N GUINEA" OR "RWANDA" OR "SENEGAL" OR "SYRIA" OR "TANZANIA" OR "UGANDA" OR "URUGUAY" OR "USSR" OR "VENEZUELA")'
apik='eebca7399544c6d877d9088b34f4485040f48f55'
def safe_str(value):
    return value if value is not None else 'None'
def wos_validate_query(query, subsection="Header", apikey=apik):
    time.sleep(3) 
    base='https://wos-api.clarivate.com/api/wos'
    params = {
        'databaseId': 'WOS',
        'usrQuery': query,
        'count': 0,
        'firstRecord': 1,
        'publishTimeSpan': '1990-01-01+2026-12-31'
    }
    irq = rq.get(
        url=base,
        params=params,
        headers={'X-ApiKey': apikey},
        timeout=15
        )
    if irq.status_code == 200:
        code, hits = irq.status_code, irq.json()['QueryResult']['RecordsFound']
        print(f'{subsection}\n  Web of Science sources: {hits}')
    else:
        code, hits = irq.status_code, 'No Results Found'
        print(f'{subsection}\n {hits} (error = {code})')
    return hits

def EBSCO_validate_query(search_terms, subsection="Header"):
    # GetClusters: Gets count from query
    # AuthoritySearch: Returns citations
    service = 'http://eit.ebscohost.com/Services/SearchService.asmx/Search?'
    params = {
        'prof': 's8860338.main.eit',
        'pwd': 'ebs2051',
        'query': search_terms,
        'startrec': 1,
        'numrec': 2,          
        'db': ['funk','aph','rfh','khh','bwh','mih','pbh','tth','noh','prh','buh'],
        'format': 'detailed'
        } 
    initial_request = rq.get(
        url=service,
        params=params,
        )
    if initial_request.status_code == 200:
        ret = ET.fromstring(initial_request.text)
        code, count = initial_request.status_code, int(ret[0].text)
        print(f'{subsection}\n  EBSCOHost sources: {count}')
 
    else:
        code, count = initial_request.status_code, 'No Response'   
        print(f'{subsection} EBSCOHost: {count} (error={code})')
    return count

def get_wos_info(rec_list=list, all_records=list,wos_records=list):   
    for rec in rec_list:
        if rec.get('UID') is not None:
            wos_rec = rec.get('static_data', {})
            wos_id = rec.get('UID') 
            wos_jinfo = rec.get('dynamic_data',{})
            wos_artinfo = wos_rec.get('summary', {})
            wos_pubinfo = wos_rec.get('fullrecord_metadata', {})
            if wos_artinfo.get('names', {}).get('count')==1: 
                authors = wos_artinfo.get('names', {}).get('name', {}).get('display_name')
            else:
                authors = ', '.join(name.get('display_name') for name in wos_artinfo.get('names', {}).get('name', []))
                authors = ', '.join(authors) if isinstance(authors,list) else authors
            if isinstance(wos_pubinfo.get('keywords'), dict): 
                keywerds = wos_pubinfo.get('keywords').get('keyword')
            else:
                keywerds = 'No keywords found'
            if isinstance(wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier'), list): 
                doi = next((item['value'] for item in wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier', []) if item.get('type') == 'doi'),'None')
                issn =  next((item['value'] for item in wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier', []) if item.get('type') == 'issn'),'None')
                isbn = next((item['value'] for item in wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier', []) if item.get('type') == 'isbn'),'None')
            else:
                doi = wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier',{})['value']
                issn = wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier',{})['value']
                isbn = wos_jinfo.get('cluster_related', {}).get('identifiers', {}).get('identifier',{})['value']
            if isinstance(wos_artinfo.get('doctypes',{}).get('doctype'),list):
                doc_t=f'{wos_artinfo.get('doctypes',{}).get('doctype')[0]} - {wos_artinfo.get('doctypes',{}).get('doctype')[1]}'
            else:
                doc_t = wos_artinfo.get('doctypes',{}).get('doctype')
            record = {
                'Date of the Search': datetime.datetime.now().strftime('%Y-%m-%d'),
                'Database':'WebofScience',
                'Title': next((item['content'] for item in wos_artinfo.get('titles', {}).get('title',[]) if item.get('type') == 'item'),'None'),
                'Authors': authors,
                'Document Type': doc_t,
                'Publication Type': wos_artinfo.get('pub_info',{}).get('pubtype'),
                'Citation Count': wos_jinfo.get('wos_usage',{}).get('alltime'),
                'Publisher': wos_artinfo.get('publishers',{}).get('publisher',{}).get('names').get('name').get('display_name'),
                'Publication Date': wos_artinfo.get('pub_info',{}).get('sortdate'),
                'Journal of Publication':next((item['content'] for item in wos_jinfo.get('titles', {}).get('title',[]) if item.get('type') == 'source'),'None'),
                'ISSN':issn,
                'ISBN': isbn,
                'DOI': doi,
                'Abstract': wos_pubinfo.get('abstracts',{}).get('abstract',{}).get('abstract_text',{}).get('p')
                }
            
            ris={
                'abstract':wos_pubinfo.get('abstracts',{}).get('abstract',{}).get('abstract_text',{}).get('p'),
                'accession_number':wos_id,
                'authors':authors,
                'date':wos_artinfo.get('pub_info',{}).get('sortdate'),
                'name_of_database':'WebofScience',
                'doi':doi,
                'database_provider':'Clarvaite',
                'number':wos_artinfo.get('pub_info',{}).get('issue'),
                'journal_name':next((item['content'] for item in wos_jinfo.get('titles', {}).get('title',[]) if item.get('type') == 'source'),'None'),
                'keywords':keywerds,
                'language':wos_pubinfo.get('languages',{}).get('language',{}).get('content'),
                'type_of_work':doc_t,
                'publisher':wos_artinfo.get('publishers',{}).get('publisher',{}).get('names').get('name').get('display_name'),
                'year':wos_artinfo.get('pub_info',{}).get('year'),
                'issn':issn,
                'start_page':wos_artinfo.get('pub_info',{}).get('page',{}).get('begin'),
                'title':next((item['content'] for item in wos_artinfo.get('titles', {}).get('title',[]) if item.get('type') == 'item'),'None'),
                'type_of_reference':wos_artinfo.get('pub_info',{}).get('pubtype'),
                'volume':wos_artinfo.get('pub_info',{}).get('vol'),
                'publication_year':wos_artinfo.get('pub_info',{}).get('year'),
                'access_date':datetime.datetime.now().strftime('%Y-%m-%d')
                }
        all_records.append(record)
        wos_records.append(ris)
    return print("WoS partial search complete")

def get_wos_citations(query, num_citations,chapter=''):
    base='https://wos-api.clarivate.com/api/wos'
    if chapter == '':
        print('Please enter a chapter name')
    else:
        citation_path = os.path.join(os.path.expanduser('~'),'Documents','Github','UCBMasters','writing','citations')
        chapter_path = os.path.join(citation_path, chapter)
        WoS_csv_out =  os.path.join(chapter_path,f"{chapter}_WebofScience.csv")
        WoS_ris_out =  os.path.join(chapter_path,f"{chapter}_WebofScience.ris")
        if not os.path.exists(chapter_path):
            os.makedirs(chapter_path)
        num_wos_cites = int(num_citations)
        wos_list_records = list(range(1,num_wos_cites,50))
        records = []
        wos_ris_file = []
        for first in wos_list_records:
            time.sleep(3)
            wos_params = {
                'databaseId': 'WOS',
                'usrQuery': query,
                'count': 50,
                'firstRecord': first,
                'publishTimeSpan': '1990-01-01+2026-12-31'}
            wos_request = rq.get(
                url=base,
                params=wos_params,
                headers={'X-ApiKey': apik},
                timeout=30)
            if wos_request.status_code == 200:
                wos_root = wos_request.json()
                wos_recs = wos_root['Data']['Records']['records']['REC']
            get_wos_info(wos_recs, records, wos_ris_file)   
        with open(WoS_ris_out, 'w', encoding='utf-32') as file:
            rispy.dump(wos_ris_file, file)
        wos_citations = pd.DataFrame(records)
        wos_citations.to_csv(WoS_csv_out)
    return records
   
def get_ebh_recs(rlist=list, all_records=list, ebh_ris=list):
    for rc in rlist:
        if rc.get('@recordID') is not None:
            ebs_rec = rc.get('header', {}).get('controlInfo', {})
            ebsco_artinfo = ebs_rec.get('artinfo', {})
            ebsco_pubinfo = ebs_rec.get('pubinfo', {})
            ebsco_jinfo = ebs_rec.get('jinfo', {})
            if isinstance(ebsco_artinfo.get('aug'), (list, dict, str)):
                ats= '; '.join(ebsco_artinfo.get('aug', {}).get('au', [])) if isinstance(ebsco_artinfo.get('aug', {}).get('au'),list) else ebsco_artinfo.get('aug', {}).get('au')
                ats = '; '.join(ats) if isinstance(ats,list) else ats
            else:
                ats=None
            if isinstance(ebsco_artinfo.get('ui'),list):
                doi = ebsco_artinfo.get('ui')[1].get('#text')
            else:
                doi = None
            if isinstance(ebsco_artinfo.get('tig', {}).get('atl'),list):
                title_ebh = ebsco_artinfo.get('tig', {}).get('atl')[1].get('#text')
            else: 
                title_ebh = ebsco_artinfo.get('tig', {}).get('atl')
            if isinstance(ebs_rec.get('language', {}),list):
                lang = ebs_rec.get('language', {}).get('#text')
            else: 
                lang = ebs_rec.get('language', {})
            record = {
                'Date of the Search': datetime.datetime.now().strftime('%Y-%m-%d'),
                'Database':'EBSCOHost',
                'Title': ebsco_artinfo.get('tig', {}).get('atl'),
                'Authors': ats,
                'Document Type': ebsco_artinfo.get('doctype'),
                'Publication Type': ebsco_artinfo.get('pubtype'),
                'Citation Count': ebsco_artinfo.get('ppct'),
                'Publisher': ebsco_pubinfo.get('pub'),
                'Publication Date': ebsco_pubinfo.get('dt', {}).get('#text'),
                'Journal of Publication': ebsco_jinfo.get('jtl'),
                'ISSN': ebsco_jinfo.get('issn'),
                'ISBN': ebsco_jinfo.get('isbn'),
                'DOI': doi,
                'Abstract': ebsco_artinfo.get('ab')
                }
            ris={
                'abstract':safe_str(ebsco_artinfo.get('ab')),
                'accession_number':safe_str(ebsco_artinfo.get('ui')),
                'authors':safe_str(ats),
                'date':safe_str(ebsco_pubinfo.get('dt', {}).get('#text')),
                'name_of_database':safe_str(rc.get('header', {}).get('@longDbName')),
                'doi':safe_str(doi),
                'database_provider':safe_str('EBSCOHost'),
                'number':safe_str(ebsco_artinfo.get('ppct')),
                'journal_name':safe_str(ebsco_jinfo.get('jtl')),
                'keywords':safe_str(ebsco_artinfo.get('su')),
                'language':safe_str(lang),
                'type_of_work':safe_str(ebsco_artinfo.get('doctype')),
                'publisher':safe_str(ebsco_pubinfo.get('pub')),
                'year':safe_str(ebsco_pubinfo.get('dt', {}).get('@year')),
                'issn':safe_str(ebsco_jinfo.get('issn')),
                'start_page':safe_str(ebsco_artinfo.get('ppf')),
                'title':safe_str(title_ebh),
                'type_of_reference':safe_str(ebsco_artinfo.get('pubtype')),
                'volume':safe_str(ebsco_pubinfo.get('vid')),
                'publication_year':safe_str(ebsco_pubinfo.get('dt', {}).get('@year')),
                'access_date':datetime.datetime.now().strftime('%Y-%m-%d')
                }
        else:
            continue
        all_records.append(record)
        ebh_ris.append(ris)
    return print("EBSCOHost partial search complete")
 
def get_ebscohost_citations(query, num_citations,chapter=''):
    if chapter == '':
        print('Please enter a chapter name')
    else:
        citation_path = os.path.join(os.path.expanduser('~'),'Documents','Github','UCBMasters','writing','citations')
        chapter_path = os.path.join(citation_path, chapter)
        ebsco_csv_out = os.path.join(chapter_path,f"{chapter}_EBSCOHost.csv")
        ebsco_ris_out = os.path.join(chapter_path,f"{chapter}_EBSCOHost.ris")
        if not os.path.exists(chapter_path):
            os.makedirs(chapter_path)
        num_ebh_cites = int(num_citations)
        ebh_list_records = list(range(1,num_ebh_cites,50))
        service = 'http://eit.ebscohost.com/Services/SearchService.asmx/Search?'  
        records = []
        ebsco_ris_file = []
        for fst in ebh_list_records:
            ebscohst = {
                'prof': 's8860338.main.eit',
                'pwd': 'ebs2051',
                'query': query,
                'startrec': fst,
                'numrec': 50,          
                'db': ['funk','aph','rfh','khh','bwh','mih','pbh','tth','noh','prh','buh'],
                'format': 'detailed'} 
            ebsco_request = rq.get(
                url=service,
                params=ebscohst)
            if ebsco_request.status_code == 200:
                ebsco_root = xmltodict.parse(ebsco_request.text)
            if int(ebsco_root['searchResponse']['Hits']['#text'])>0:
                ebh_recs = ebsco_root['searchResponse']['SearchResults']['records']['rec']
            else:
                continue
            get_ebh_recs(ebh_recs, records,ebsco_ris_file)
        with open(ebsco_ris_out, 'w', encoding='utf-32', errors='ignore') as file:
            rispy.dump(ebsco_ris_file, file)
        ebscohost_citations = pd.DataFrame(records)
        ebscohost_citations.to_csv(ebsco_csv_out)
    return records
   
# Defining Parameters
### Query Terms

ozone = "(surface ozone OR ground ozone OR O3 OR ozone)"
models = "(linear regression OR ridge regression OR LASSO OR adaboost OR gradient boost OR random forest OR machine learn OR deep learn)"
ecology = "(environment OR public health OR public polic OR air pollution OR air quality OR air chemistry)"
human = "(death OR mortality OR injur* OR illness* OR death toll* OR hospital*)" 
risk = "(dispropo* OR vulner* OR risk* OR health burden)"
prediction = "(predict* OR air qual* OR air chem* OR model* OR evaluat* OR forecast OR simulation)"
transport = "(transport* OR trajector* OR circulat* OR advection* OR plume OR dispersion*)"

#WoS Formatting
all_wos = f'(TS=({ozone} AND {models} AND {ecology} AND {human} AND {risk} AND {prediction} AND {transport}) AND LA=(English))'
literature_review_wos = f'(TS=({ozone} AND {models} AND {prediction} AND {transport}) AND LA=(English))'
processing_wos = f'(TS=({ozone} AND {models} AND {prediction}) AND LA=(English))'
discussion_wos = f'(TS=({ozone} AND {ecology} AND {human} AND {risk} AND {transport}) AND LA=(English))'

# EBSCOHost Formatting
all_ebsco = f'LN ({ozone} AND {models} AND {ecology} AND {human} AND {risk} AND {prediction} AND {transport}) AND LA (english)'
literature_review_ebsco = f'LN ({ozone} AND {models} AND {prediction} AND {transport}) AND LA (english)'
processing_ebsco = f'LN ({ozone} AND {models} AND {prediction}) AND LA (english)'
discussion_ebsco = f'LN ({ozone} AND {ecology} AND {human} AND {risk} AND {transport}) AND LA (english)'

# # Inst. Scholar Formatting
# all_ebsco = f'LN ({ozone} AND {models} AND {ecology} AND {human} AND {risk} AND {prediction} AND {transport}) AND LA (english)'
# literature_review_ebsco = f'LN ({ozone} AND {models} AND {prediction} AND {transport}) AND LA (english)'
# processing_ebsco = f'LN ({ozone} AND {models} AND {prediction}) AND LA (english)'
# discussion_ebsco = f'LN ({ozone} AND {ecology} AND {human} AND {risk} AND {transport}) AND LA (english)'

q1_num = wos_validate_query(all_wos, 'All Terms')
q2_num = wos_validate_query(literature_review_wos, 'Literature Review')
q3_num = wos_validate_query(processing_wos, 'Preprocessing')
q4_num = wos_validate_query(discussion_wos, 'Discussion')

q5_num = EBSCO_validate_query(all_ebsco, 'All Terms')
q6_num = EBSCO_validate_query(literature_review_ebsco, 'Literature Review')
q7_num = EBSCO_validate_query(processing_ebsco, 'Preprocessing')
q8_num = EBSCO_validate_query(discussion_ebsco, 'Discussion')

all_records = []
all_records.extend(get_wos_citations(literature_review_wos, q1_num,chapter='lit_rev'))
all_records.extend(get_wos_citations(processing_wos, q2_num,chapter='preprocessing'))
all_records.extend(get_wos_citations(discussion_wos, q3_num,chapter='discussion'))
all_records.extend(get_ebscohost_citations(literature_review_ebsco, q4_num,chapter='lit_rev'))
all_records.extend(get_ebscohost_citations(processing_ebsco, q5_num,chapter='preprocessing'))
all_records.extend(get_ebscohost_citations(discussion_ebsco, q6_num,chapter='discussion'))
all_records = pd.DataFrame(all_records)
all_records.to_csv(os.path.join(os.path.expanduser('~'),'Documents','Github','UCBMasters','writing','citations','fin_partial_ozone_citations.csv'))

literature =  pd.read_csv(os.path.join(os.path.expanduser('~'), "Documents", "Github", "UCBMasters", "writing",'citations','fin_partial_ozone_citations.csv'))

def similarities(all_records):
    '''Creates a Venn Diagram for main words in the search paramaters'''

    abstracts = all_records['Abstract'].fillna('').astype(str).tolist()
    # Vectorize the abstracts using TF-IDF
    vectorizer = TfidfVectorizer().fit_transform(abstracts)
    cosine_sim_matrix = cosine_similarity(vectorizer)
    # Identify pairs of abstracts with > 95% similarity
    to_remove = set()
    n = len(abstracts)
    for i in range(n):
        for j in range(i + 1, n):
            if cosine_sim_matrix[i, j] > 0.95:
                to_remove.add(j)  # remove the later duplicate
    # Drop rows with highly similar abstracts
    df_final = all_records.drop(list(to_remove)).dropna()
    Transport = ["transport*", "trajectory", "circulation", "advection", "plume", "dispersion", "air chemisty", "air quality"]
    Modeling = ["linear regression", "ridge regression", "LASSO", "adaboost", "gradient boost", "random forest", "machine learn", "deep learn"]
    Impact = ["death", "mortality", "injury", "illness*", "hospital", "disproportionate", "vulnerable", "risk","burden"]
    # Convert abstracts to lowercase for searching
    abstracts_lower = df_final['Abstract'].fillna('').str.lower()
    # Create masks
    Transport_mask = abstracts_lower.str.contains('|'.join(Transport), na=False)
    Modeling_mask = abstracts_lower.str.contains('|'.join(Modeling), na=False)
    Impact_mask = abstracts_lower.str.contains('|'.join(Impact), na=False)
    # Initialize Category column
    df_final['Category'] = ''
    # Assign categories — update directly
    df_final.loc[Transport_mask, 'Category'] += 'Transport; '
    df_final.loc[Modeling_mask, 'Category'] += 'Models; '
    df_final.loc[Impact_mask, 'Category'] += 'Impact; '
    # Strip trailing semicolons
    df_final['Category'] = df_final['Category'].str.strip('; ')
    model_set = set(df_final[Transport_mask].index)
    health_set = set(df_final[Modeling_mask].index)
    transport_set = set(df_final[Impact_mask].index)
    # Generate 3-set Venn diagram
    plt.figure(figsize=(8, 6))
    venn3([model_set, health_set, transport_set], set_labels=('Transport', 'Models', 'Impact'))
    plt.title('Venn Diagram of Literature by Topic')
    plt.tight_layout()
    plt.show()

def wordcloud(df_final):
    '''Creates a wordcloud for the desired content. Automatically uses abstracts by default'''
    custom_stopwords = STOPWORDS.union({
        'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'am', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'shall', 'should', 'can', 'could','due','using',
        'may', 'might', 'must', 'ought','sub','c','elsevier','h','H','sup',
        'at', 'by', 'for', 'in', 'of', 'on', 'to', 'with', 'about', 'against',
        'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
        'from', 'up', 'down', 'off', 'over', 'under', 'again', 'further', 'then',
        'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
        'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
        'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    })
    all_text = (
        df_final['Title'].fillna('').astype(str) + ' ' +
        df_final['Abstract'].fillna('').astype(str)
    ).str.lower().str.cat(sep=' ')
    filtered_wordcloud = WordCloud(
        width=1000,
        height=600,
        background_color='white',
        stopwords=custom_stopwords,
        colormap='brg'
    ).generate(all_text)
    # Plot the filtered word cloud
    plt.figure(figsize=(7, 4))
    plt.imshow(filtered_wordcloud, interpolation='bilinear')
    plt.axis('off')
    plt.title('Word Cloud of Titles and Abstracts (Filtered)')
    plt.tight_layout()
    plt.show()

def pubsot(df_final):
    '''Creates a time line of available literature and identifies frequency of publications to gauge interest overtime'''
    # Ensure 'Publication Year' is numeric
    df_final['Publication Date'] = pd.to_numeric(df_final['Publication Date'], errors='coerce')
    # Count publications by year
    year_counts = df_final['Publication Date'].dropna().value_counts().sort_index()
    # Plot publications over time with counts above points
    plt.figure(figsize=(7, 4))
    ax = sns.lineplot(x=year_counts.index, y=year_counts.values, color='black', linewidth=2)
    # Plot points in gold with black outline
    plt.scatter(year_counts.index, year_counts.values, color='gold', edgecolors='black', s=70, zorder=3,marker='^')
    for x, y in zip(year_counts.index, year_counts.values):
        plt.text(x, y + 1, str(y), ha='center', va='bottom', fontsize=11,
                path_effects=[plt.matplotlib.patheffects.withStroke(linewidth=3, foreground="white")])

    # Final styling
    plt.title('Publications Over Time')
    plt.xlabel('Year')
    plt.ylabel('Number of Publications')
    plt.grid(True)
    plt.tight_layout()
    plt.show()