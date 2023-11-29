from enum import Enum
from typing import Dict

class LLMOption(str, Enum):
    # VENDOR_NAME + MODEL_NAME
    OPENAI_GPT3_5_TURBO_0613 = 'OPENAI_GPT3_5_TURBO_0613'
    OPENAI_GPT4_0613 = 'OPENAI_GPT4_0613'
    ANTHROPIC_CLAUDE_2 = 'ANTHROPIC_CLAUDE_2'
    META_LLAMA_70B = 'META_LLAMA_70B'
    META_LLAMA_175B = 'META_LLAMA_175B'

    def resolve(self) -> Dict[str, str]:
        if self == LLMOption.OPENAI_GPT3_5_TURBO_0613:
            return {
                'vendor': 'openai',
                'model': 'gpt-3.5-turbo-16k-0613',
            }
        elif self == LLMOption.OPENAI_GPT4_0613:
            return {
                'vendor': 'openai',
                'model': 'gpt-4-0613',
            }
        elif self == LLMOption.ANTHROPIC_CLAUDE_2:
            return {
                'vendor': 'anthropic',
                'model': 'claude-2',
            }
        elif self == LLMOption.META_LLAMA_70B:
            return {
                'vendor': 'meta-llama',
                'model': '70b',
            }
        elif self == LLMOption.META_LLAMA_175B:
            return {
                'vendor': 'meta-llama',
                'model': '175b',
            }
        else:
            raise Exception('Invalid LLMOption')