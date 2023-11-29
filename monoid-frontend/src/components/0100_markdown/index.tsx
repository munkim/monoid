import React from 'react';
import ReactMarkdown from 'react-markdown';
import RehypeKatex from 'rehype-katex';
import RemarkBreaks from 'remark-breaks';
import RemarkGfm from 'remark-gfm';
import RemarkMath from 'remark-math';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atelierHeathLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import { getCorrectCapitalizationLanguageName } from 'src/utils/function';

import './styles.module.scss';

type Props = {
  content: string;
};

const Markdown: React.FC<Props> = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[ RemarkMath, RemarkGfm, RemarkBreaks ]}
    rehypePlugins={[ RehypeKatex ]}
    components={{
      // eslint-disable-next-line react/no-unstable-nested-components
      code({ inline, className, children, ...props }) {
        const match = /language-(\w+)/.exec( className || '' );
        const language = match?.[1];
        const languageShowName = getCorrectCapitalizationLanguageName(
          language || '',
        );
        return !inline && match ? (
          <div className="my-10">
            <div className="flex items-center justify-between pl-3">
              <div className="font-normal text-gray-500 bg-monoid-100 text-13 selection:bg-blue-700 selection:text-white">
                {languageShowName}
              </div>
              <div style={{ display: 'flex' }} />
            </div>
            <SyntaxHighlighter
              {...props}
              style={atelierHeathLight}
              className="pl-12 bg-white selection:bg-blue-700 selection:text-white"
              language={match[1]}
              showLineNumbers
              PreTag="div"
            >
              {String( children ).replace( /\n$/, '' )}
            </SyntaxHighlighter>
          </div>
        ) : (
          <code {...props} className={className}>
            {children}
          </code>
        );
      },
    }}
    linkTarget="_blank"
  >
    {content}
  </ReactMarkdown>
);

export default Markdown;
