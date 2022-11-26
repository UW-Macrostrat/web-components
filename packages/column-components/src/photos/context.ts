/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { Component, createContext } from "react";
import T from "prop-types";
import h from "@macrostrat/hyper";

// Default value for computePhotoPath
const computePhotoPath = src => src;

const PhotoLibraryContext = createContext({
  photos: null,
  computePhotoPath
});

const PhotoShape = T.shape({
  src: T.string.isRequired,
  caption: T.string
});

class PhotoLibraryProvider extends Component {
  static initClass() {
    this.propTypes = {
      photos: T.arrayOf(PhotoShape),
      computePhotoPath: T.func
    };
    this.defaultProps = {
      computePhotoPath
    };
  }
  render() {
    const { children, ...rest } = this.props;
    return h(PhotoLibraryContext.Provider, { value: rest, children });
  }
}
PhotoLibraryProvider.initClass();

export { PhotoLibraryProvider, PhotoLibraryContext };
