import { FC, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import OpenAI from 'src/assets/openai.png';
import Anthropic from 'src/assets/anthropic.png';
import Cohere from 'src/assets/cohere.png';
import Meta from 'src/assets/meta.png';
import LLMModelSocket from 'src/sockets/LLMModelSocket';
import updateAgent, { TPayload } from 'src/mutations/updateAgent';
import { TProjectUpdateResponse } from 'src/types/project';

interface IProps {
  llmOption?: string;
  llmApiKey?: string;
  isEditable?: boolean;
}

const LLMModel: FC<IProps> = ({
  llmOption,
  llmApiKey,
  isEditable = false,
}) => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { mutate: update } = useMutation<
    TProjectUpdateResponse,
    unknown,
    TPayload
  >( updateAgent, {
    onSuccess() {
      queryClient.invalidateQueries([ 'agent', id ]);
    },
  });

  const [ selectedLLMOption, setSelectedLLMOption ] = useState( llmOption );
  const handleSelect = (newllmOption: string) => {
    update({ agentId: Number(id), llmOption: newllmOption});
  }

  // Update setSelectedLLMOption when the initia prop changes
  useEffect(() => {
    setSelectedLLMOption(llmOption);
  }, [llmOption]);

  return (
    <div className="mb-8">
      <div className="font-bold mb-2 text-2xl border-b">
        Foundational LLM
      </div>
      <div>Select the brain of your agent.</div>
      <LLMModelSocket
        isSelected={selectedLLMOption === 'OPENAI_GPT3_5_TURBO_0613'}
        imgSrc={OpenAI}
        label="OpenAI GPT 3.5"
        llmApiKey={selectedLLMOption === llmOption ? llmApiKey : ''}
        isEditable={isEditable}
        onClick={() => {
          isEditable && handleSelect('OPENAI_GPT3_5_TURBO_0613');
        }}
      />
      <LLMModelSocket
        // disabled
        isSelected={selectedLLMOption === 'OPENAI_GPT4_0613'}
        imgSrc={OpenAI}
        label="OpenAI GPT 4"
        llmApiKey={selectedLLMOption === llmOption ? llmApiKey: ''}
        isEditable={isEditable}
        onClick={() => {
          isEditable && handleSelect('OPENAI_GPT4_0613');
        }}
      />
      <LLMModelSocket
        disabled
        isSelected={selectedLLMOption === 'ANTHROPIC_CLAUDE_2'}
        imgSrc={Anthropic}
        label="Anthropic Claude 2"
        llmApiKey={selectedLLMOption === llmOption ? llmApiKey: ''}
        isEditable={isEditable}
        onClick={() => {
          isEditable && handleSelect('ANTHROPIC_CLAUDE_2');
        }}
      />
      <LLMModelSocket
        disabled
        isSelected={selectedLLMOption === 'META_LLAMA_70B'}
        imgSrc={Cohere}
        label="Cohere"
        llmApiKey={selectedLLMOption === llmOption ? llmApiKey: ''}
        isEditable={isEditable}
        onClick={() => {
          isEditable && handleSelect('META_LLAMA_70B');
        }}
      />
      <LLMModelSocket
        disabled
        isSelected={selectedLLMOption === 'META_LLAMA_175B'}
        imgSrc={Meta}
        label="Meta LLAMA 175B"
        llmApiKey={selectedLLMOption === llmOption ? llmApiKey: ''}
        isEditable={isEditable}
        onClick={() => {
          isEditable && handleSelect('META_LLAMA_175B');
        }}
      />
    </div>
  );
};
export default LLMModel;
