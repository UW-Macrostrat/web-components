/** Checkin list component
 *
 * TODO: Integrate or deduplicate with CheckinListing component
 * */

import hyper from "@macrostrat/hyper";
import styles from "./index.module.sass";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useDarkMode } from "@macrostrat/ui-components";
import { Icon } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";

const h = hyper.styled(styles);

export interface CheckinProps {
  result: Array<{
    checkin_id: number;
    person_id: number;
    first_name: string;
    last_name: string;
    notes: string;
    rating: number;
    lng: number;
    lat: number;
    near: string;
    created: string;
    added: string;
    photo: string | null;
    likes: string;
    comments: number;
    liked: boolean;
    status: number;
    observations: Array<{
      obs_id: number;
      photo: number;
      lng: number | null;
      lat: number | null;
      orientation: object;
      rocks: object;
      fossils: object;
      minerals: object;
      comments: number;
    }>;
    xp: {
      checkin: number;
      observation: number;
      comment: number;
      like: number;
      total: number;
    };
    name?: string | null;
  }>;
  mapRef?: React.RefObject<mapboxgl.Map>;
  setInspectPosition?: (position: { lat: number; lng: number }) => void;
  rockdCheckinURL: string;
  rockdImageURL: string;
  rockdProfilePicURL: string;
}

export function RockdWebsiteCheckinList(props: CheckinProps) {
  /** Checkin list component used in the Rockd website */
  const {
    result,
    mapRef,
    setInspectPosition,
    rockdCheckinURL,
    rockdImageURL,
    rockdProfilePicURL,
  } = props;
  const isDarkMode = useDarkMode().isEnabled;
  let checkins = [];
  const map = mapRef?.current;
  const len = result.length;
  const color = isDarkMode ? "white" : "black";

  return h(
    result.map((checkin) => {
      // format rating
      let ratingArr = [];
      for (var i = 0; i < checkin.rating; i++) {
        ratingArr.push(
          h(Icon, { className: "star", icon: "star", style: { color } }),
        );
      }

      for (var i = 0; i < 5 - checkin.rating; i++) {
        ratingArr.push(
          h(Icon, { className: "star", icon: "star-empty", style: { color } }),
        );
      }

      let imageView = null;

      if (checkin.photo != null) {
        const imgSrc = getImageUrl(
          checkin.person_id,
          checkin.photo,
          rockdImageURL,
        );
        imageView = h([
          h("img.observation-img", {
            className: "observation-img",
            src: imgSrc,
          }),
          h("div.image-details", [
            h("h1.details", "Details"),
            h(Icon, {
              className: "details-image",
              icon: "arrow-right",
              style: { color },
            }),
          ]),
        ]);
      } else {
        imageView = h("div.no-image", [
          h("h1.details", "Details"),
          h(Icon, {
            className: "details-image",
            icon: "arrow-right",
            style: { color },
          }),
        ]);
      }

      // for trips
      const stop_name = checkin?.name ?? null;
      const LngLatProps = {
        position: {
          lat: checkin.lat,
          lng: checkin.lng,
        },
        precision: 3,
        zoom: 10,
      };

      return h(
        "div.checkin",
        {
          onClick: () => {
            map.flyTo({ center: [checkin.lng, checkin.lat], zoom: 12 });
            if (setInspectPosition)
              setInspectPosition({ lat: checkin.lat, lng: checkin.lng });
          },
          onMouseEnter: () => {
            if (len > 1) {
              // marker
              const el = document.createElement("div");
              el.className = "marker_pin";

              // Create marker
              new mapboxgl.Marker(el)
                .setLngLat([checkin.lng, checkin.lat])
                .addTo(map);
            }
          },
          onMouseLeave: () => {
            let previous = document.querySelectorAll(".marker_pin");
            previous.forEach((marker) => {
              marker.remove();
            });
          },
        },
        [
          h("h1.stop-name", stop_name),
          h("div.checkin-header", [
            !stop_name
              ? h(
                  "h3.profile-pic",

                  h("img.profile-pic", {
                    src: getProfilePicUrl(
                      checkin.person_id,
                      rockdProfilePicURL,
                    ),
                  }),
                )
              : null,
            h("div.checkin-info", [
              !stop_name
                ? h(
                    "h3",
                    { className: "name" },
                    checkin.first_name + " " + checkin.last_name,
                  )
                : null,
              h("h4", { className: "edited" }, checkin.created),
              h("p", "Near " + checkin.near),
              h(LngLatCoords, LngLatProps),
              h("h3", { className: "rating" }, ratingArr),
            ]),
          ]),
          h("p", { className: "description" }, checkin.notes),
          h(
            "a",
            {
              className: "checkin-link",
              href: rockdCheckinURL + "/" + checkin.checkin_id,
              target: "_blank",
            },
            imageView,
          ),
          h("div", { className: "checkin-footer" }, [
            h("div", { className: "likes-container" }, [
              h(Icon, {
                className: "likes-icon " + (isDarkMode ? "icon-dark-mode" : ""),
                icon: "thumbs-up",
                style: { color },
              }),
              h("h3", { className: "likes" }, checkin.likes),
            ]),
            h("div", { className: "observations-container" }, [
              h(Icon, {
                className:
                  "observations-icon " + (isDarkMode ? "icon-dark-mode" : ""),
                icon: "camera",
                style: { color },
              }),
              h("h3", { className: "likes" }, checkin.observations.length),
            ]),
            h("div", { className: "comments-container" }, [
              h(Icon, {
                className:
                  "comments-icon " + (isDarkMode ? "icon-dark-mode" : ""),
                icon: "comment",
                style: { color },
              }),
              h("h3", { className: "comments" }, checkin.comments),
            ]),
          ]),
        ],
      );
    }),
  );
}

function getImageUrl(person_id, photo_id, rockdImageURL) {
  return rockdImageURL + "/" + person_id + "/thumb_large/" + photo_id;
}

function getProfilePicUrl(person_id, rockdProfilePicURL) {
  return rockdProfilePicURL + "/" + person_id;
}
