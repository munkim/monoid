import clsx from 'clsx';
import {
  FC,
  PropsWithChildren,
  useRef,
  useEffect,
  useState,
} from 'react';

const Sidebar: FC<PropsWithChildren> = ({ children }) => {
  const minWidth = 50;
  const regularWidth = 240;
  const maxWidth = 280;

  // const [width, setWidth] = useState(regularWidth);
  const [width, setWidth] = useState(
    Number( localStorage.getItem("sidebarWidth") ) || regularWidth
  );
  const isResized = useRef(false);

  useEffect(() => {
    window.addEventListener("mousemove", (e) => {
      if (!isResized.current) {
        return;
      }
      
      setWidth((previousWidth) => {
        if (window.innerWidth < 768) {
          return minWidth;
        }
        // If currentX is less than minWidth, do not move the handle
        if (e.clientX < minWidth || e.clientX > maxWidth) {
          return previousWidth;
        }
        const newWidth = previousWidth + e.movementX / 1.5;
        const isWidthInRange = newWidth >= minWidth && newWidth <= maxWidth;
        return isWidthInRange ? newWidth : previousWidth;
      });
    });

    window.addEventListener("mouseup", () => {
      isResized.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("resize", () => {
      isResized.current = true;
      if (window.innerWidth < 768) {
        setWidth(minWidth);
      } else {
        setWidth(regularWidth);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebarWidth", `${width}`);
  }, [width]);

  return (
    <div
      className={clsx(
        'flex h-[calc(100vh-50px)] md:h-[calc(100vh-59px)] mt-[50px] md:mt-[59px]',
        isResized.current
          ? 'transition-none duration-0'
          : 'transition-all duration-300',
      )}
    >
      <div className="flex-shrink overflow-auto" style={{ width: `${width / 16}rem` }}>{children}</div>

      {/* Handle */}
      <div
        className="h-screen w-0 overflow-hidden border-l border-collapse border-monoid-300 cursor-col-resize z-20 px-1"
        onMouseDown={() => {
          isResized.current = true;
        }}
        role="button"
        tabIndex={0}
        aria-label="Resize sidebar"
      />
    </div>
  );
};

export default Sidebar;
