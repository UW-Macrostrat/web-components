import { useContext, useEffect, createContext, ReactNode } from "react";
import h from "@macrostrat/hyper";
// Default value for computePhotoPath
const passThrough = (src) => src;

interface PhotoLibraryCtx {
  photos: PhotoData[] | null;
  computePhotoPath: (src: string) => string;
}

export const PhotoLibraryContext = createContext<PhotoLibraryCtx>({
  photos: null,
  computePhotoPath: passThrough,
});

interface PhotoData {
  id: number;
  src: string;
  caption?: string;
}

interface PhotoLibraryProviderProps extends PhotoLibraryCtx {
  children: ReactNode;
}

export function PhotoLibraryProvider(props: PhotoLibraryProviderProps) {
  const { children, computePhotoPath = passThrough, photos } = props;
  return h(PhotoLibraryContext.Provider, {
    value: {
      photos,
      computePhotoPath,
    },
    children,
  });
}

export function PhotoOverlay(props) {
  const { photos, computePhotoPath } = useContext(PhotoLibraryContext);
  if (photos == null) {
    return null;
  }
  const { photoIDs, ...rest } = props;

  const displayedPhotos = photoIDs.map((id) => {
    return photos.find((d) => d.id === id);
  });

  const getPaths = function (d) {
    const src = computePhotoPath(d);
    return { src, caption: d.note };
  };

  const images = displayedPhotos.filter((d) => d != null).map(getPaths);

  return h(PhotoGallery, {
    images,
    ...rest,
  });
}

const PhotoGallery = function ({ images, isOpen = false, onClose }) {
  /** The photo gallery component  has been removed due to an outdated design.
   * Please use another library for this functionality.
   */
  useEffect(() => {
    console.error(
      "PhotoOverlay from @macrostrat/column-components has been disabled due to an outdated design. Please use another library for this functionality.",
    );
  }, []);
  return null;
};
