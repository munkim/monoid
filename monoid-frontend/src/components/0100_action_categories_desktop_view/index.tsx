import clsx from 'clsx';
import { FC } from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import Button from 'src/components/0100_button';
import { TActionCategoriesResponse } from 'src/types/actionCategories';

interface IProps {
  categories: TActionCategoriesResponse;
  isFetching: boolean;
  selectedCategoryId: string;
  onCategoryChange: ({ categoryId }: { categoryId: string }) => void;
}

const ActionCategoriesDesktopView: FC<IProps> = ({
  categories,
  isFetching,
  selectedCategoryId,
  onCategoryChange,
}) => (
  <div className="hidden md:block">
    <Button
      variant={selectedCategoryId === 'my_actions' ? 'softLight' : 'white'}
      className="mb-2 w-full"
      onClick={() => onCategoryChange({ categoryId: 'my_actions' })}
    >
      <div className="flex justify-between items-cente">
        <div className="py-0.5 font-semibold">🧩 My Projects</div>
      </div>
    </Button>
    <div className="font-semibold pt-2 pb-2">Community Projects</div>
    {isFetching && categories.length === 0 ? (
      <ScaleLoader color="#6D4D64" />
    ) : (
      <div className="border border-monoid-300 rounded">
        {categories.map( category => (
          <button
            key={category.id}
            type="button"
            className={clsx(
              'w-full text-left px-4 py-2 rounded transition-colors ',
              {
                'bg-monoid-300 text-monoid-900 hover:bg-monoid-300 hover:text-monoid-900':
                  category.id === Number( selectedCategoryId ),
                'bg-white hover:bg-monoid-300':
                  category.id !== Number( selectedCategoryId ),
              },
            )}
            onClick={() =>
              onCategoryChange({ categoryId: String( category.id ) })
            }
          >
            {category.name}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default ActionCategoriesDesktopView;
