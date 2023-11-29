import { FC, useState } from 'react';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import clsx from 'clsx';
import { TActionCategoriesResponse } from 'src/types/actionCategories';

interface IProps {
  categories: TActionCategoriesResponse;
  selectedCategoryId: string;
  onCategoryChange: ({ categoryId }: { categoryId: string }) => void;
}

const ActionCategoriesMobileView: FC<IProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
}) => {
  const [ isCategoryExpanded, setIsCategoryExpanded ] = useState( false );

  return (
    <div className="md:hidden mb-2">
      <button
        type="button"
        className="flex justify-between border border-monoid-300 rounded px-4 py-2 w-full bg-white"
        onClick={() => setIsCategoryExpanded( x => !x )}
      >
        <div>
          Category:{' '}
          {categories.find( x => x.id === Number( selectedCategoryId ))?.name ||
            ( selectedCategoryId === 'my_actions' ? '🧩 My Actions' : 'All' )}
        </div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={clsx( 'mt-1 transition-transform', {
            'rotate-180': isCategoryExpanded,
          })}
        />
      </button>
      <div className="absolute h-0 mt-2 w-[calc(100vw-16px)]">
        <div
          className={clsx(
            'overflow-auto border-monoid-300 rounded transition-all duration-300',
            {
              'max-h-0': !isCategoryExpanded,
              'border max-h-[50vh]': isCategoryExpanded,
            },
          )}
        >
          <button
            key="my-actions"
            type="button"
            className={clsx(
              'w-full text-left px-4 py-2 opacity-95 transition-colors hover:bg-monoid-300',
              {
                'bg-monoid-900 text-monoid-100 hover:bg-monoid-900 hover:text-monoid-100':
                  selectedCategoryId === 'my_actions',
                'bg-monoid-100': selectedCategoryId !== 'my_actions',
              },
            )}
            onClick={() => {
              onCategoryChange({ categoryId: 'my_actions' });
              setTimeout(() => setIsCategoryExpanded( false ), 100 );
            }}
          >
            🧩 My Projects
          </button>
          <div className="p-2 bg-monoid-300 font-semibold">
            Community Projects
          </div>
          {categories.map( category => (
            <button
              key={category.id}
              type="button"
              className={clsx(
                'w-full text-left px-4 py-2 opacity-95 transition-colors text-monoid-700',
                {
                  'bg-monoid-900 text-monoid-100 hover:bg-monoid-900 hover:text-monoid-100':
                    category.id === Number( selectedCategoryId ),
                  'bg-monoid-100': category.id !== Number( selectedCategoryId ),
                },
              )}
              onClick={() => {
                onCategoryChange({ categoryId: String( category.id ) });
                setTimeout(() => setIsCategoryExpanded( false ), 100 );
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionCategoriesMobileView;
