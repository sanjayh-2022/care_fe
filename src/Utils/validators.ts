import { t } from "i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { z } from "zod";

export default () => ({
  phoneNumber: {
    optional: z
      .string()
      .optional()
      .refine((val) => !val || isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),

    required: z
      .string()
      .min(1, { message: t("field_required") })
      .refine((val) => isValidPhoneNumber(val), {
        message: t("phone_number_validation_error"),
      }),
  },

  coordinates: {
    latitude: z
      .number()
      .min(-90, t("invalid_latitude"))
      .max(90, t("invalid_latitude")),

    longitude: z
      .number()
      .min(-180, t("invalid_longitude"))
      .max(180, t("invalid_longitude")),
  },
});
