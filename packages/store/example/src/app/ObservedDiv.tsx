import React, { useEffect, useState } from 'react';

type props = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

export function ObservedDiv({ children, ...props }: props) {
  const [isVisible, setIsVisible] = useState(false);
  const [div, setDiv] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!div) return;
    const observer = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) {
        setIsVisible(true);
      }
    });
    observer.observe(div);
    return () => observer.disconnect();
  }, [div]);

  return (
    <div {...props} ref={setDiv}>
      {isVisible && children}
    </div>
  );
}
