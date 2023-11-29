import { FC, ReactNode } from 'react';
import Button from '../0100_button';

interface IProps {
  isForwardDisabled?: boolean;
  forwardText?: string | ReactNode | null;
  onBack: () => void;
  onForward?: () => void;
}

const ProjectNavigation: FC<IProps> = ({
  forwardText,
  isForwardDisabled = false,
  onBack,
  onForward,
}) => (
  <div className="fixed bottom-0 py-4 pt-2 md:pt-4 w-[calc(100vw-32px)] md:w-[calc(100vw-64px)] border-t border-monoid-700 bg-monoid-100">
    <div className="grid grid-cols-1 md:grid-cols-2 items-center ">
      <Button
        className="border-0 px-0 justify-self-start w-full text-left"
        variant="link"
        onClick={onBack}
      >
        Back
      </Button>

      {onForward && (
        <div className="flex justify-end">
          <Button
            className="md:max-w-[320px] w-full justify-self-end"
            variant="invert"
            disabled={isForwardDisabled}
            onClick={onForward}
          >
            {forwardText}
          </Button>
        </div>
      )}
    </div>
  </div>
);

export default ProjectNavigation;
