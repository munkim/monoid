import { FC } from 'react';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import { faSquare } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export type TOption = {
  id: number;
  name: string;
  description?: string;
};

interface IProps extends TOption {
  isSelected?: boolean;
  onChange: ( val: number ) => void;
}

const Option: FC<IProps> = ({
  id,
  name,
  description,
  isSelected = false,
  onChange,
}) => (
  <button
    type="button"
    className="flex w-full p-2 hover:bg-monoid-300 border-t border-monoid-300"
    onClick={() => onChange( id )}
  >
    <FontAwesomeIcon
      icon={isSelected ? faCheckSquare : faSquare}
      className="fa-fw text-xl pt-1"
    />
    <div className="text-left">
      <div className="font-bold">{name}</div>
      <div className="text-sm opacity-90 mt-1">{description}</div>
    </div>
  </button>
);

export default Option;
