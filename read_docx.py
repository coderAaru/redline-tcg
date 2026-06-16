import zipfile
import xml.etree.ElementTree as ET

def get_docx_text(path):
    WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
    PARA = WORD_NAMESPACE + 'p'
    TEXT = WORD_NAMESPACE + 't'
    TABLE = WORD_NAMESPACE + 'tbl'
    ROW = WORD_NAMESPACE + 'tr'
    CELL = WORD_NAMESPACE + 'tc'
    
    with zipfile.ZipFile(path) as zf:
        xml_content = zf.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # We want to extract text including tables in a readable way
        lines = []
        
        # Traverse children of body
        body = root.find(WORD_NAMESPACE + 'body')
        if body is None:
            # Fallback to simple iter
            for elem in root.iter():
                if elem.tag == PARA:
                    texts = [node.text for node in elem.iter(TEXT) if node.text]
                    if texts:
                        lines.append(''.join(texts))
            return '\n'.join(lines)
            
        for child in body:
            if child.tag == PARA:
                texts = [node.text for node in child.iter(TEXT) if node.text]
                lines.append(''.join(texts))
            elif child.tag == TABLE:
                lines.append("\n[TABLE START]")
                for row in child.iter(ROW):
                    row_cells = []
                    for cell in row.iter(CELL):
                        cell_text = ''.join([node.text for node in cell.iter(TEXT) if node.text])
                        row_cells.append(cell_text)
                    lines.append(" | ".join(row_cells))
                lines.append("[TABLE END]\n")
                
        return '\n'.join(lines)

if __name__ == '__main__':
    text = get_docx_text('Redline_TCG_System_Specification_Blueprint_V7.docx')
    with open('blueprint.txt', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Extracted blueprint.txt successfully.")
