import { FC } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

import './style.css';

type TProps = {
  code: string;
  readOnly?: boolean;
};

const hightlightWithLineNumbers = ( input: string ) =>
  Prism.highlight( input, Prism.languages.json, 'json' )
    .split( '\n' )
    .map(
      ( line: any, i: number ) =>
        `<span class='editorLineNumber'>${i + 1}</span>${line}`,
    )
    .join( '\n' );

const CodeEditor: FC<TProps> = ({ code, readOnly = false }) => (
  <div className="overflow-y-auto min-h-[300px] max-h-[500px] rounded-md">
    <Editor
      value={code}
      onValueChange={() => null}
      highlight={code => hightlightWithLineNumbers( code )}
      padding={10}
      textareaId="codeArea"
      className="editor"
      readOnly={readOnly}
      style={{
        fontFamily: '"Fira code", "Fira Mono", monospace',
        fontSize: 14,
        outline: 0,
        minHeight: 300,
      }}
    />
  </div>
);

export default CodeEditor;
