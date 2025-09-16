{%- import "macro/cite.html" as cite -%}

{%- set references = load_data(path="pwbc.bib", format="bibtex") -%}

{{ cite::note(references=references, citation_key=key, locator=loc, remark=rmk) }}
