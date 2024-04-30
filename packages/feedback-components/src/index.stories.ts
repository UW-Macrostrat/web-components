import { Meta } from "@storybook/react";
import FeedbackWrap from "./FeedbackWrap";

export default {
  title: "Feedback components/FeedbackComponent",
  component: FeedbackWrap,
} as Meta;

const data1 = {
  "text": "the mount galen volcanics consists of basalt, andesite, dacite, and rhyolite lavas and dacite and rhyolite tuff and tuff breccia. The Hayhook formation was named, mapped and discussed by lasky and webber 1949. the formation ranges up to at least 2500 feet in thickness.",
  "strats": [
      {
          "term_type": "strat_name",
          "txt_range": [
              [
                  4,
                  25
              ]
          ],
          "children": [
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        38,
                        44
                    ]
                ]
              },
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        46,
                        54
                    ]
                ]
              },
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        56,
                        62
                    ]
                ]
              },
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        87,
                        93
                    ]
                ]
              },
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        107,
                        111
                    ]
                ],
                "children": [
                    {
                      "term_type": "att_amod",
                      "txt_range": [
                          [
                            98,
                            106
                          ]
                        ]
                    }
                ]
              },
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        116,
                        120
                    ]
                ]
              },
              {
                "term_type": "lith",
                "txt_range": [
                    [
                        121,
                        128
                    ]
                ]
              },
              {
                "term_type": "lith_NOUN",
                "txt_range": [
                    [
                        77,
                        82
                    ]
                ],
                "children": [
                    {
                      "term_type": "att_amod",
                      "txt_range": [
                          [
                              68,
                              76
                          ]
                      ]
                    }
                ]

              }
          ]
      },
      {
          "term_type": "strat_name",
          "txt_range": [
              [
                  130,
                  151
              ],
              [
                  210,
                  223
              ]
          ]
      }
  ]
};

export const Basic = { args: { data: data1 } };

const empty = {
    "text": "the artillery formation was named, mapped and discussed by lasky and webber (1949). more recently otton (1977, 1978) discussed preliminary results of his continuing regional studies. the general geologic settings of the two localities visited are shown in figures 18 and 19. the formation ranges up to at least 2500 feet in thickness. two localities in the type artillery formation as defined by lasky and webber were visited, the masterson claims and the lucky four claims. the masterson claims are west from artillery peak, and are contained in the lower part of the westward dipping artillery formation (figure 18). uranium mineralization is found in laminated mudstone-shale-1imestone beds just above a basal 150 ft. thick red arkosic conglomerate believed to be depositional on porphyritic granite. the low energy elastics contain many bright colors, and radioactivity is found in many individual units especially in a bright green colored shale-rnudstone sequence (to 5x), but the most pronounced anomaly (16x) was found in a somewhat cherty, dark colored, thinly bedded limestone unit about three ft. thick. much recent dozer activity and drilling in the area is evident.",
    "strats": []
}

export const Empty = { args: { data: empty } };