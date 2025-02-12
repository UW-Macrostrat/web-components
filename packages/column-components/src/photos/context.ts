import { Component, createContext, ReactNode } from "react";
import h from "@macrostrat/hyper";

// Default value for computePhotoPath
const computePhotoPath = (src) => src;

export const PhotoLibraryContext = createContext<PhotoLibraryProviderProps>({
  photos: null,
  computePhotoPath,
});

interface PhotoData {
  id: number;
  src: string;
  caption?: string;
}

interface PhotoLibraryProviderProps {
  photos: PhotoData[] | null;
  computePhotoPath: (src: string) => string;
}

export class PhotoLibraryProvider extends Component<
  PhotoLibraryProviderProps & { children: ReactNode }
> {
  static defaultProps = {
    computePhotoPath,
  };

  render() {
    const { children, ...rest } = this.props;
    return h(PhotoLibraryContext.Provider, { value: rest, children });
  }
}
