/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from 'react-hyperscript';
import {createContext, useState, useContext} from 'react';
import update from 'immutability-helper';
import LocalStorage from '../util/storage';
import T from 'prop-types';

const SettingsUpdateContext = createContext(function(){});
const SettingsContext = createContext({});

// Could rework this to use `constate` or similar

const SettingsProvider = function(props){
  /*
  A settings provider that can be used with LocalStorage
  */
  let {storageID, children, ...defaultSettings} = props;
  // Update from local storage
  let storage = null;
  if (storageID != null) {
    // Merge initial options if set
    storage = new LocalStorage(storageID);
    const v = storage.get() || {};
    console.log("Loading from local storage", v);
    defaultSettings = update(defaultSettings, {$merge: v});
  }

  const [settings, setState] = useState(defaultSettings);
  const updateState = function(spec){
    const newSettings = update(settings, spec);
    setState(newSettings);
    if (storage != null) { return storage.set(newSettings); }
  };

  return h(SettingsContext.Provider, {value: settings}, [
    h(SettingsUpdateContext.Provider, {value: updateState}, children)
  ]);
};

SettingsProvider.propTypes = {
  storageID: T.string
};

const useSettings = () => useContext(SettingsContext);

const updateSettings = function(func){
  // Update settings using `immutability-helper` semantics
  const updater = useContext(SettingsUpdateContext);
  return function() { return updater(func(...arguments)); };
};

export {SettingsProvider, SettingsContext, useSettings, updateSettings};
