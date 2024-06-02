import React from 'react';

export type UseIntersectionObserverTarget =
  | React.RefObject<Element | null>
  | (() => Element)
  | Element;

export interface UseIntersectionObserverOptions extends Omit<IntersectionObserverInit, 'root'> {
  immediate?: boolean;
  onChange?: (entry: IntersectionObserverEntry) => void;
  root?: IntersectionObserverInit['root'] | React.RefObject<Element | null>;
}

const getTargetElement = (target: UseIntersectionObserverTarget) => {
  if (typeof target === 'function') {
    return target();
  }

  if (target instanceof Element) {
    return target;
  }

  return target.current;
};

const getRootElement = (root: UseIntersectionObserverOptions['root']) => {
  if (!root) return document;

  if (root instanceof Element) {
    return root;
  }

  if (root instanceof Document) {
    return root;
  }

  return root.current;
};

export interface UseIntersectionObserverReturn {
  inView: boolean;
  entry?: IntersectionObserverEntry;
}

export type UseIntersectionObserver = {
  <Target extends UseIntersectionObserverTarget>(
    target: Target,
    options?: UseIntersectionObserverOptions
  ): UseIntersectionObserverReturn;

  <Target extends UseIntersectionObserverTarget>(
    options?: UseIntersectionObserverOptions,
    target?: never
  ): UseIntersectionObserverReturn & { ref: React.RefObject<Target> };
};

export const useIntersectionObserver = ((...params: any[]) => {
  const target = (
    typeof params[0] === 'object' && !('current' in params[0]) ? undefined : params[0]
  ) as UseIntersectionObserverTarget | undefined;
  const options = (target ? params[1] : params[0]) as UseIntersectionObserverOptions | undefined;

  const [entry, setEntry] = React.useState<IntersectionObserverEntry>();
  const internalRef = React.useRef<Element>(null);

  const onChangeRef = React.useRef<UseIntersectionObserverOptions['onChange']>();
  onChangeRef.current = options?.onChange;

  React.useEffect(() => {
    const element = target ? getTargetElement(target) : internalRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        onChangeRef.current?.(entry);
      },
      {
        ...options,
        root: getRootElement(options?.root)
      }
    );

    observer.observe(element!);

    return () => {
      observer.disconnect();
    };
  }, [target, options?.rootMargin, options?.threshold]);

  if (!target) return { ref: internalRef, entry, inView: !!entry?.isIntersecting };
  return { entry, inView: !!entry?.isIntersecting };
}) as UseIntersectionObserver;
