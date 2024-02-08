import { useSettingsStore } from "./store";

export interface StoreLoadedProps {
  children: React.ReactNode;
}

export const StoreLoader = (props: StoreLoadedProps) => {
  const hydrated = useSettingsStore((state) => state._hydrated);

  if (!hydrated) {
    return null;
  }

  return <>{props.children}</>;
};

export default StoreLoader;
