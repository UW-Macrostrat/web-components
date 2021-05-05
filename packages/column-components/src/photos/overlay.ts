/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, useState, useContext } from "react";
import h from "@macrostrat/hyper";
//import Carousel, {ModalGateway, Modal} from 'react-images'
//import {PhotoLibraryContext} from './context'

const PhotoGallery = function (props) {
  const { images, isOpen, onClose, ...rest } = props;
  // We just disable this until we figure it out.
  return null;
  const [ix, setIndex] = useState(0);
  const increment = (step) =>
    function () {
      const newIx = (ix + step) % images.length;
      return setIndex(newIx);
    };

  return h(ModalGateway, null, [
    h.if(isOpen),
    Modal,
    { onClose },
    [
      h(Carousel, {
        views: images,
        currentIndex: ix,
        ...rest,
      }),
    ],
  ]);
};

const PhotoOverlay = function (props) {
  // TODO: figure out web error "Cannot find module `fscreen`"
  return null;
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
};

export { PhotoOverlay };
