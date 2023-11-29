import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FC } from 'react';
import { Link, Outlet } from 'react-router-dom';

interface IProps {
  label: string;
  icon: IconProp;
  to: string;
}

const PageTitleResponsiveText: FC<IProps> = ({ icon, label, to }) => (
  <>
    <span className="opacity-50 last-of-type:opacity-100">
      <Link to={to} className="hidden md:inline-flex">
        {label}
      </Link>
      <Link to={to} className="md:hidden">
        <FontAwesomeIcon icon={icon} />
      </Link>
    </span>
    <Outlet />
  </>
);

export default PageTitleResponsiveText;
