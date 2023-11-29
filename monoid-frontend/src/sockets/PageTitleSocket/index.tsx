import { FC } from 'react';
import MonoidHeaderLogo from 'src/components/0100_monoid_header_logo';
import AccountSocket from '../AccountSocket';
import LeftHeaderTitle from './LeftHeaderTitle';
// import RightHeaderTitle from './RightHeaderTitle';

const PageTitleSocket: FC = () => (
  <div className="fixed top-0 w-full border-b border-monoid-300 p-1 px-2 md:p-2 md:px-8 z-50">
    <div className="flex justify-between items-center">
      <div className="flex">
        <div className="flex justify-between items-center font-bold text-md md:text-xl mr-2 max-w-[calc(100vw-134px)] md:max-w-[calc(100vw-312px)] whitespace-nowrap overflow-hidden">
          <div className="flex">
            <MonoidHeaderLogo />
            <div className="max-w-[calc(100vw-134px)] md:max-w-none overflow-x-auto">
              <LeftHeaderTitle />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center text-base">
        {/* <RightHeaderTitle /> */}
        <AccountSocket />
      </div>
    </div>
  </div>
);

export default PageTitleSocket;
