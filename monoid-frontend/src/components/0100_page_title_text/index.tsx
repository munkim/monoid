import { FC } from 'react';
import { Link, Outlet } from 'react-router-dom';

interface IProps {
  label: string;
  to?: string;
  includeOutlet?: boolean;
}

const PageTitleText: FC<IProps> = ({ includeOutlet, label, to }) => (
  <>
    {to ? (
      <span className="opacity-50 last-of-type:opacity-100">
        <Link to={to}>{label}</Link>
      </span>
    ) : (
      <span className="opacity-50 last-of-type:opacity-100">{`${label}`}</span>
    )}
    {includeOutlet && <Outlet />}
  </>
);

export default PageTitleText;
