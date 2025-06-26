import hyper from "@macrostrat/hyper";
import styles from "./checkins.module.sass";
import { LngLatCoords } from "@macrostrat/map-interface";
import { useDarkMode } from "@macrostrat/ui-components";
import { Icon } from "@blueprintjs/core";
import mapboxgl from "mapbox-gl";

const h = hyper.styled(styles);

function BlankImage({ src, className, width, height, onClick, onError, alt }) {
  return h("img", {
    src: src,
    className,
    width,
    height,
    onClick,
    onError,
    alt,
  });
}

function getImageUrl(person_id, photo_id, rockdAPIUrl) {
  return (
    rockdAPIUrl + "/protected/image/" + person_id + "/thumb_large/" + photo_id
  );
}

function getProfilePicUrl(person_id, rockdAPIUrl) {
  return rockdAPIUrl + "/protected/gravatar/" + person_id;
}

interface CheckinProps {
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
  rockdAPIUrl: string;
}

export function CreateCheckins(props: CheckinProps) {
  const { result, mapRef, setInspectPosition, rockdAPIUrl } = props;
  const isDarkMode = useDarkMode().isEnabled;
  let checkins = [];
  const map = mapRef?.current;
  const len = result.length;
  const color = isDarkMode ? "white" : "black";

  result.forEach((checkin) => {
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

    let image;
    const imgSrc = getImageUrl(checkin.person_id, checkin.photo, rockdAPIUrl);
    const showImage = checkin.photo;

    if (showImage) {
      image = h(BlankImage, { className: "observation-img", src: imgSrc });
    } else {
      image = h("div", { className: "no-image" }, [
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

    let temp = h(
      "div",
      {
        className: "checkin",
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
        h("h1", { className: "stop-name" }, stop_name),
        h("div", { className: "checkin-header" }, [
          !stop_name
            ? h(
                "h3",
                { className: "profile-pic" },
                h(BlankImage, {
                  src: getProfilePicUrl(checkin.person_id, rockdAPIUrl),
                  className: "profile-pic",
                }),
              )
            : null,
          h("div", { className: "checkin-info" }, [
            !stop_name
              ? h(
                  "h3",
                  { className: "name" },
                  checkin.first_name + " " + checkin.last_name,
                )
              : null,
            h("h4", { className: "edited" }, checkin.created),
            h("p", "Near " + checkin.near),
            LngLatCoords(LngLatProps),
            h("h3", { className: "rating" }, ratingArr),
          ]),
        ]),
        h("p", { className: "description" }, checkin.notes),
        h(
          "a",
          {
            className: "checkin-link",
            href: "/checkin/" + checkin.checkin_id,
            target: "_blank",
          },
          [
            image,
            showImage
              ? h("div", { className: "image-details" }, [
                  h("h1.details", "Details"),
                  h(Icon, {
                    className: "details-image",
                    icon: "arrow-right",
                    style: { color },
                  }),
                ])
              : null,
          ],
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

    checkins.push(temp);
  });

  return checkins;
}
