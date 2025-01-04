import careConfig from "@careConfig";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate, useQueryParams } from "raviger";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import SectionNavigator from "@/CAREUI/misc/SectionNavigator";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import DuplicatePatientDialog from "@/components/Facility/DuplicatePatientDialog";

import useAppHistory from "@/hooks/useAppHistory";

import {
  BLOOD_GROUP_CHOICES, // DOMESTIC_HEALTHCARE_SUPPORT_CHOICES,
  GENDER_TYPES, // OCCUPATION_TYPES,
  //RATION_CARD_CATEGORY, // SOCIOECONOMIC_STATUS_CHOICES ,
} from "@/common/constants";
import countryList from "@/common/static/countries.json";
import { validatePincode } from "@/common/validation";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  dateQueryString,
  getPincodeDetails,
  parsePhoneNumber,
} from "@/Utils/utils";
import OrganizationSelector from "@/pages/Organization/components/OrganizationSelector";
import { PatientModel, validatePatient } from "@/types/emr/patient";

import Autocomplete from "../ui/autocomplete";

interface PatientRegistrationPageProps {
  facilityId: string;
  patientId?: string;
}

export default function PatientRegistration(
  props: PatientRegistrationPageProps,
) {
  const [{ phone_number }] = useQueryParams();
  const { patientId, facilityId } = props;
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [samePhoneNumber, setSamePhoneNumber] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [ageDob, setAgeDob] = useState<"dob" | "age">("dob");
  const [_showAutoFilledPincode, setShowAutoFilledPincode] = useState(false);
  const [form, setForm] = useState<Partial<PatientModel>>({
    nationality: "India",
    phone_number: phone_number || "+91",
    emergency_phone_number: "+91",
  });
  const [feErrors, setFeErrors] = useState<
    Partial<Record<keyof PatientModel, string[]>>
  >({});
  const [suppressDuplicateWarning, setSuppressDuplicateWarning] =
    useState(!!patientId);
  const [debouncedNumber, setDebouncedNumber] = useState<string>();

  const sidebarItems = [
    { label: t("patient__general-info"), id: "general-info" },
    // { label: t("social_profile"), id: "social-profile" },
    //{ label: t("volunteer_contact"), id: "volunteer-contact" },
    //{ label: t("patient__insurance-details"), id: "insurance-details" },
  ];

  const mutationFields: (keyof PatientModel)[] = [
    "name",
    "phone_number",
    "emergency_phone_number",
    "geo_organization",
    "gender",
    "blood_group",
    "date_of_birth",
    "age",
    "address",
    "permanent_address",
    "pincode",
    "nationality",
    "meta_info",
    "ration_card_category",
  ];

  const mutationData: Partial<PatientModel> = {
    ...Object.fromEntries(
      Object.entries(form).filter(([key]) =>
        mutationFields.includes(key as keyof PatientModel),
      ),
    ),
    date_of_birth:
      ageDob === "dob" ? dateQueryString(form.date_of_birth) : undefined,
    age: ageDob === "age" ? form.age : undefined,
    meta_info: {
      ...(form.meta_info as any),
      occupation:
        form.meta_info?.occupation === ""
          ? undefined
          : form.meta_info?.occupation,
    },
  };

  const createPatientMutation = useMutation({
    mutationFn: mutate(routes.addPatient),
    onSuccess: (resp: PatientModel) => {
      Notification.Success({
        msg: t("patient_registration_success"),
      });
      // Lets navigate the user to the verify page as the patient is not accessible to the user yet
      navigate(`/facility/${facilityId}/patients/verify`, {
        query: {
          phone_number: resp.phone_number,
          year_of_birth:
            ageDob === "dob"
              ? new Date(resp.date_of_birth!).getFullYear()
              : new Date().getFullYear() - Number(resp.age!),
          partial_id: resp?.id?.slice(0, 5),
        },
      });
    },
    onError: () => {
      Notification.Error({
        msg: t("patient_registration_error"),
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: mutate(routes.updatePatient, {
      pathParams: { id: patientId || "" },
    }),
    onSuccess: () => {
      Notification.Success({
        msg: t("patient_update_success"),
      });
      goBack();
    },
    onError: () => {
      Notification.Error({
        msg: t("patient_update_error"),
      });
    },
  });

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientQuery.data) {
      setForm(patientQuery.data);
      if (patientQuery.data.year_of_birth && !patientQuery.data.date_of_birth) {
        setAgeDob("age");
      }
      if (
        patientQuery.data.phone_number ===
        patientQuery.data.emergency_phone_number
      )
        setSamePhoneNumber(true);
      if (patientQuery.data.address === patientQuery.data.permanent_address)
        setSameAddress(true);
    }
  }, [patientQuery.data]);

  const handlePincodeChange = async (value: string) => {
    if (!validatePincode(value)) return;
    if (form.state && form.district) return;

    const pincodeDetails = await getPincodeDetails(
      value,
      careConfig.govDataApiKey,
    );
    if (!pincodeDetails) return;

    const { statename: _stateName, districtname: _districtName } =
      pincodeDetails;

    setShowAutoFilledPincode(true);
    setTimeout(() => {
      setShowAutoFilledPincode(false);
    }, 2000);
  };

  useEffect(() => {
    const timeout = setTimeout(
      () => handlePincodeChange(form.pincode?.toString() || ""),
      1000,
    );
    return () => clearTimeout(timeout);
  }, [form.pincode]);

  const title = !patientId
    ? t("add_details_of_patient")
    : t("update_patient_details");

  const errors = {
    ...feErrors,
    ...(createPatientMutation.error as unknown as string[]),
  };

  const fieldProps = (field: keyof typeof form) => ({
    value: form[field] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({
        ...f,
        [field]: e.target.value === "" ? undefined : e.target.value,
      })),
  });

  const selectProps = (field: keyof typeof form) => ({
    value: (form[field] as string)?.toString(),
    onValueChange: (value: string) =>
      setForm((f) => ({ ...f, [field]: value })),
  });

  const handleDialogClose = (action: string) => {
    if (action === "transfer") {
      navigate(`/facility/${facilityId}/patients`, {
        query: {
          phone_number: form.phone_number,
        },
      });
    } else {
      setSuppressDuplicateWarning(true);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validate = validatePatient(form, ageDob === "dob");
    if (typeof validate !== "object") {
      patientId
        ? updatePatientMutation.mutate({ ...mutationData, ward_old: undefined })
        : createPatientMutation.mutate({
            ...mutationData,
            facility: facilityId,
            ward_old: undefined,
          });
    } else {
      const firstErrorField = document.querySelector("[data-input-error]");
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      Notification.Error({
        msg: t("please_fix_errors"),
      });
      setFeErrors(validate);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (!patientId || patientQuery.data?.phone_number !== form.phone_number) {
        setSuppressDuplicateWarning(false);
      }
      setDebouncedNumber(form.phone_number);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [form.phone_number]);

  const patientPhoneSearch = useQuery({
    queryKey: ["patients", "phone-number", debouncedNumber],
    queryFn: query(routes.searchPatient, {
      body: {
        phone_number: parsePhoneNumber(debouncedNumber || "") || "",
      },
    }),
    enabled: !!parsePhoneNumber(debouncedNumber || ""),
  });

  const duplicatePatients = patientPhoneSearch.data?.results.filter(
    (p) => p.id !== patientId,
  );
  if (patientId && patientQuery.isLoading) {
    return <Loading />;
  }

  return (
    <Page title={title}>
      <hr className="mt-4" />
      <div className="relative mt-4 flex flex-col md:flex-row gap-4">
        <SectionNavigator sections={sidebarItems} className="hidden md:flex" />
        <form className="md:w-[500px]" onSubmit={handleFormSubmit}>
          <div id={"general-info"}>
            <h2 className="text-lg font-semibold">
              {t("patient__general-info")}
            </h2>
            <div className="text-sm">{t("general_info_detail")}</div>
            <br />
            <div className="mb-4">
              <Label
                htmlFor="name"
                className={errors.name ? "text-red-500" : ""}
              >
                {t("name")}
              </Label>
              <Input
                id="name"
                {...fieldProps("name")}
                placeholder={t("type_patient_name")}
                className={`mt-1 block w-full border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
              />
              {errors.name &&
                errors.name.map((error, index) => (
                  <span key={index} className="text-sm text-red-500 mt-1">
                    {error}
                  </span>
                ))}
            </div>
            <br />
            <div className="mb-4">
              <Label
                htmlFor="phone_number"
                className={errors.phone_number ? "text-red-500" : ""}
              >
                {t("phone_number")}
              </Label>
              <Input
                id="phone_number"
                {...fieldProps("phone_number")}
                onChange={(e) => {
                  if (e.target.value.length > 13) return;
                  setForm((f) => ({
                    ...f,
                    phone_number: e.target.value,
                    emergency_phone_number: samePhoneNumber
                      ? e.target.value
                      : f.emergency_phone_number,
                  }));
                }}
                className={`mt-1 block w-full border ${
                  errors.phone_number ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
              />
              {errors.phone_number &&
                errors.phone_number.map((error, index) => (
                  <span key={index} className="text-sm text-red-500 mt-1">
                    {error}
                  </span>
                ))}
            </div>

            <div className="mt-1 flex gap-1 items-center">
              <div className="mb-4 flex items-center gap-2">
                <Checkbox
                  checked={samePhoneNumber}
                  onCheckedChange={() => {
                    const newValue = !samePhoneNumber;
                    setSamePhoneNumber(newValue);
                    if (newValue) {
                      setForm((f) => ({
                        ...f,
                        emergency_phone_number: f.phone_number,
                      }));
                    }
                  }}
                  id="same-phone-number"
                  className=""
                />
                <Label htmlFor="same-phone-number" className="">
                  {t("use_phone_number_for_emergency")}
                </Label>
              </div>
            </div>
            <br />
            <div className="mb-4">
              <Label
                htmlFor="emergency_phone_number"
                className={errors.emergency_phone_number ? "text-red-500" : ""}
              >
                {t("emergency_phone_number")}
              </Label>
              <Input
                id="emergency_phone_number"
                {...fieldProps("emergency_phone_number")}
                onChange={(e) => {
                  if (e.target.value.length > 13) return;
                  setForm((f) => ({
                    ...f,
                    emergency_phone_number: e.target.value,
                  }));
                }}
                disabled={samePhoneNumber}
                className={`mt-1 block w-full border ${
                  errors.emergency_phone_number
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
              />
              {errors.emergency_phone_number && (
                <span className="text-sm text-red-500 mt-1">
                  {errors.emergency_phone_number.map((error, index) => (
                    <span key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </span>
                  ))}
                </span>
              )}
            </div>

            {/* <br />
            <Input
              // This field does not exist in the backend, but is present in the design
              required
              label={t("emergency_contact_person_name_details")}
              placeholder={t("emergency_contact_person_name")}
            /> */}
            <br />
            <div className="mb-4">
              <Label
                htmlFor="gender"
                className={errors.gender ? "text-red-500" : ""}
              >
                {t("sex")}
              </Label>
              <RadioGroup
                value={form.gender?.toString()}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, gender: value }))
                }
                className={`mt-1 flex items-center gap-4 ${
                  errors.gender ? "border-red-500" : ""
                }`}
              >
                {GENDER_TYPES.map((g) => (
                  <Fragment key={g.id}>
                    <RadioGroupItem
                      value={g.id.toString()}
                      id={`gender_${g.id}`}
                    />
                    <Label
                      htmlFor={`gender_${g.id}`}
                      className={errors.gender ? "text-red-500" : ""}
                    >
                      {t(`GENDER__${g.id}`)}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
              {errors.gender && (
                <span className="text-sm text-red-500 mt-1">
                  {errors.gender.map((error, index) => (
                    <span key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </span>
                  ))}
                </span>
              )}
            </div>

            <br />
            <div className="mb-4">
              <Label
                htmlFor="blood_group"
                className={errors.blood_group ? "text-red-500" : ""}
              >
                {t("blood_group")}
              </Label>
              <Select {...selectProps("blood_group")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUP_CHOICES.map((bg) => (
                    <SelectItem key={bg.id} value={bg.id}>
                      {bg.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.blood_group && (
                <span className="text-sm text-red-500 mt-1">
                  {errors.blood_group.map((error, index) => (
                    <span key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </span>
                  ))}
                </span>
              )}
            </div>

            <br />
            <Tabs
              value={ageDob}
              onValueChange={(value: string) =>
                setAgeDob(value as typeof ageDob)
              }
            >
              <TabsList className="mb-4">
                {[
                  ["dob", t("date_of_birth")],
                  ["age", t("age")],
                ].map(([key, label]) => (
                  <TabsTrigger value={key}>{label}</TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="dob">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="mb-4">
                      <Label
                        htmlFor="day"
                        className={errors.date_of_birth ? "text-red-500" : ""}
                      >
                        {t("day")}
                      </Label>
                      <Input
                        id="day"
                        placeholder="DD"
                        type="number"
                        value={form.date_of_birth?.split("-")[2] || ""}
                        max={31}
                        min={1}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            date_of_birth: `${
                              form.date_of_birth?.split("-")[0] || ""
                            }-${form.date_of_birth?.split("-")[1] || ""}-${e.target.value}`,
                          }))
                        }
                        className={`mt-1 block w-full border ${
                          errors.date_of_birth
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
                      />
                      {errors.date_of_birth && (
                        <span className="text-sm text-red-500 mt-1">
                          {errors.date_of_birth.map((error, index) => (
                            <span
                              key={index}
                              className="text-sm text-red-500 mt-1"
                            >
                              {error}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <Label
                        htmlFor="month"
                        className={errors.date_of_birth ? "text-red-500" : ""}
                      >
                        {t("month")}
                      </Label>
                      <Input
                        id="month"
                        placeholder="MM"
                        type="number"
                        value={form.date_of_birth?.split("-")[1] || ""}
                        max={12}
                        min={1}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            date_of_birth: `${
                              form.date_of_birth?.split("-")[0] || ""
                            }-${e.target.value}-${form.date_of_birth?.split("-")[2] || ""}`,
                          }))
                        }
                        className={`mt-1 block w-full border ${
                          errors.date_of_birth
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
                      />
                      {errors.date_of_birth && (
                        <span className="text-sm text-red-500 mt-1">
                          {errors.date_of_birth.map((error, index) => (
                            <span
                              key={index}
                              className="text-sm text-red-500 mt-1"
                            >
                              {error}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <Label
                        htmlFor="year"
                        className={errors.date_of_birth ? "text-red-500" : ""}
                      >
                        Year
                      </Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="YYYY"
                        value={form.date_of_birth?.split("-")[0] || ""}
                        maxLength={4}
                        max={new Date().getFullYear()}
                        min={1900}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            date_of_birth: `${e.target.value}-${form.date_of_birth?.split("-")[1] || ""}-${form.date_of_birth?.split("-")[2] || ""}`,
                          }))
                        }
                        className={`mt-1 block w-full border ${
                          errors.date_of_birth
                            ? "border-red-500"
                            : "border-gray-300"
                        } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
                      />
                      {errors.date_of_birth && (
                        <span className="text-sm text-red-500 mt-1">
                          {errors.date_of_birth.map((error, index) => (
                            <span
                              key={index}
                              className="text-sm text-red-500 mt-1"
                            >
                              {error}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {errors["date_of_birth"] && (
                  <span className="text-sm text-red-500 mt-1">
                    {errors["date_of_birth"].map((error, index) => (
                      <span key={index} className="text-sm text-red-500 mt-1">
                        {error}
                      </span>
                    ))}
                  </span>
                )}
              </TabsContent>
              <TabsContent value="age">
                <div className="bg-yellow-500/10 border border-yellow-500 rounded-md p-4 text-sm text-yellow-800 mb-4">
                  {t("age_input_warning")}
                  <br />
                  <b>{t("age_input_warning_bold")}</b>
                </div>
                <div className="relative">
                  <div className="mb-4">
                    <Label
                      htmlFor="age"
                      className={errors["year_of_birth"] ? "text-red-500" : ""}
                    >
                      {t("age")}
                    </Label>
                    <Input
                      id="age"
                      value={form.age || undefined}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          age: e.target.value,
                          year_of_birth: e.target.value
                            ? new Date().getFullYear() - Number(e.target.value)
                            : undefined,
                        }))
                      }
                      type="number"
                      required
                      className={`mt-1 block w-full border ${
                        errors["year_of_birth"]
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
                    />
                    {errors["year_of_birth"] && (
                      <span className="text-sm text-red-500 mt-1">
                        {errors["year_of_birth"].map((error, index) => (
                          <span
                            key={index}
                            className="text-sm text-red-500 mt-1"
                          >
                            {error}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>

                  {form.year_of_birth && (
                    <div className="text-xs absolute right-6 top-[22px] bottom-0 flex items-center justify-center p-2 pointer-events-none">
                      {t("year_of_birth")} : {form.year_of_birth}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <br />
            <div className="mb-4">
              <Label
                htmlFor="address"
                className={errors["address"] ? "text-red-500" : ""}
              >
                {t("current_address")}
              </Label>
              <Textarea
                id="address"
                {...fieldProps("address")}
                value={form.address || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    address: e.target.value,
                    permanent_address: sameAddress
                      ? e.target.value
                      : f.permanent_address,
                  }))
                }
                required
                className={`mt-1 block w-full border ${
                  errors["address"] ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
              />
              {errors["address"] && (
                <span className="text-sm text-red-500 mt-1">
                  {errors["address"].map((error, index) => (
                    <span key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </span>
                  )) || "This field is required"}
                </span>
              )}
            </div>

            <div className="mt-1 flex gap-1 items-center">
              <div className="mb-4">
                <Label
                  htmlFor="same-address"
                  className={errors["sameAddress"] ? "text-red-500" : ""}
                >
                  {t("use_address_as_permanent")}
                </Label>
                <Checkbox
                  id="same-address"
                  checked={sameAddress}
                  onCheckedChange={() => {
                    setSameAddress(!sameAddress);
                    setForm((f) => ({
                      ...f,
                      permanent_address: !sameAddress
                        ? f.address
                        : f.permanent_address,
                    }));
                  }}
                  className={`mt-1 block ${
                    errors["sameAddress"] ? "border-red-500" : "border-gray-300"
                  } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
                />
                {errors["sameAddress"] && (
                  <span className="text-sm text-red-500 mt-1">
                    {errors["sameAddress"] &&
                      errors["sameAddress"].map((error, index) => (
                        <span key={index} className="text-sm text-red-500 mt-1">
                          {error}
                        </span>
                      ))}
                  </span>
                )}
              </div>
            </div>
            <br />
            <div className="mb-4">
              <Label
                htmlFor="permanent_address"
                className={errors["permanent_address"] ? "text-red-500" : ""}
              >
                {t("permanent_address")}
              </Label>
              <Textarea
                id="permanent_address"
                value={form.permanent_address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, permanent_address: e.target.value }))
                }
                disabled={sameAddress}
                className={`mt-1 block w-full border ${
                  errors["permanent_address"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
              />
              {errors["permanent_address"] && (
                <span className="text-sm text-red-500 mt-1">
                  {errors["permanent_address"].map((error, index) => (
                    <span key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </span>
                  )) || "This field is required"}
                </span>
              )}
            </div>

            {/* <br />
            <Input
              // This field does not exist in the backend, but is present in the design
              label={t("landmark")}
            /> */}
            <br />
            <div className="mb-4">
              <Label
                htmlFor="pincode"
                className={errors["pincode"] ? "text-red-500" : ""}
              >
                {t("pincode")}
              </Label>
              <Input
                id="pincode"
                {...fieldProps("pincode")}
                type="number"
                className={`mt-1 block w-full border ${
                  errors["pincode"] ? "border-red-500" : "border-gray-300"
                } rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200`}
              />
              {errors["pincode"] && (
                <span className="text-sm text-red-500 mt-1">
                  {errors["pincode"].map((error, index) => (
                    <span key={index} className="text-sm text-red-500 mt-1">
                      {error}
                    </span>
                  )) || "This field is required"}
                </span>
              )}
            </div>

            {/* {showAutoFilledPincode && (
              <div>
                <CareIcon
                  icon="l-check-circle"
                  className="mr-2 text-sm text-green-500"
                />
                <span className="text-sm text-primary-500">
                  {t("pincode_autofill")}
                </span>
              </div>
            )} */}
            <br />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <Label
                    htmlFor="nationality"
                    className={
                      errors["nationality"] ? "text-red-500 mb-2" : "mb-2"
                    }
                  >
                    {t("nationality")}
                  </Label>
                  <Autocomplete
                    options={countryList.map((c) => ({ label: c, value: c }))}
                    value={form.nationality || ""}
                    onChange={(value) => {
                      setForm((f) => ({
                        ...f,
                        nationality: value,
                      }));
                    }}
                  />
                  {errors["nationality"] && (
                    <span className="text-sm text-red-500 mt-1">
                      {errors["nationality"].map((error, index) => (
                        <span key={index} className="text-sm text-red-500 mt-1">
                          {error}
                        </span>
                      )) || "This field is required"}
                    </span>
                  )}
                </div>
              </div>
              {form.nationality === "India" && (
                <>
                  <OrganizationSelector
                    required={true}
                    onChange={(value) =>
                      setForm((f) => ({
                        ...f,
                        geo_organization: value,
                      }))
                    }
                  />
                </>
              )}
            </div>
          </div>
          {/* <div id="social-profile" className="mt-10"> */}
          {/* <h2 className="text-lg font-semibold">
              {t("patient__social-profile")}
            </h2>
            <div className="text-sm">{t("social_profile_detail")}</div>
            <br /> */}
          {/* <div>
              <InputWithError label={t("occupation")}>
                <Autocomplete
                  options={OCCUPATION_TYPES.map((occupation) => ({
                    label: occupation.text,
                    value: occupation.value,
                  }))}
                  value={form.meta_info?.occupation || ""}
                  onChange={(value) =>
                    setForm((f) => ({
                      ...f,
                      meta_info: { ...(f.meta_info as any), occupation: value },
                    }))
                  }
                />
              </InputWithError>
            </div> */}
          {/* <br /> */}
          {/* <div>
              <InputWithError
                label={t("ration_card_category")}
                errors={errors["ration_card_category"]}
              >
                <Select {...selectProps("ration_card_category")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATION_CARD_CATEGORY.map((rcg) => (
                      <SelectItem key={rcg} value={rcg}>
                        {t(`ration_card__${rcg}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InputWithError>
            </div> */}
          {/* <br /> */}
          {/* <InputWithError label={t("socioeconomic_status")}>
              <RadioGroup
                value={form.meta_info?.socioeconomic_status}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    meta_info: {
                      ...(f.meta_info as any),
                      socioeconomic_status: value,
                    },
                  }))
                }
                className="flex items-center gap-4"
              >
                {SOCIOECONOMIC_STATUS_CHOICES.map((sec) => (
                  <Fragment key={sec}>
                    <RadioGroupItem value={sec} id={"sec_" + sec} />
                    <Label htmlFor={"sec_" + sec}>
                      {t(`SOCIOECONOMIC_STATUS__${sec}`)}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
            </InputWithError> */}
          {/* <br /> */}
          {/* <InputWithError label={t("has_domestic_healthcare_support")}>
              <RadioGroup
                value={form.meta_info?.domestic_healthcare_support}
                onValueChange={(value) =>
                  setForm((f) => ({
                    ...f,
                    meta_info: {
                      ...(f.meta_info as any),
                      domestic_healthcare_support: value,
                    },
                  }))
                }
                className="flex items-center gap-4"
              >
                {DOMESTIC_HEALTHCARE_SUPPORT_CHOICES.map((dhs) => (
                  <Fragment key={dhs}>
                    <RadioGroupItem value={dhs} id={"dhs_" + dhs} />
                    <Label htmlFor={"dhs_" + dhs}>
                      {t(`DOMESTIC_HEALTHCARE_SUPPORT__${dhs}`)}
                    </Label>
                  </Fragment>
                ))}
              </RadioGroup>
            </InputWithError> */}
          {/* </div> */}
          {/* <div id="volunteer-contact" className="mt-10">
            <h2 className="text-lg font-semibold">
              {t("patient__volunteer-contact")}
            </h2>
            <div className="text-sm">{t("volunteer_contact_detail")}</div>
            <br />

          </div> */}
          {/* <div id="insurance-details" className="mt-10">
            <h2 className="text-lg font-semibold">
              {t("patient__insurance-details")}
            </h2>
            <div className="text-sm">{t("insurance_details_detail")}</div>
            <br />
          </div> */}
          <div className="flex justify-end mt-20 gap-4">
            <Button
              variant={"secondary"}
              type="button"
              onClick={() => goBack()}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant={"primary"}
              disabled={
                patientId
                  ? updatePatientMutation.isPending
                  : createPatientMutation.isPending
              }
            >
              {patientId ? t("save") : t("save_and_continue")}
            </Button>
          </div>
        </form>
      </div>
      {!patientPhoneSearch.isLoading &&
        !!duplicatePatients?.length &&
        !!parsePhoneNumber(debouncedNumber || "") &&
        !suppressDuplicateWarning && (
          <DuplicatePatientDialog
            patientList={duplicatePatients}
            handleOk={handleDialogClose}
            handleCancel={() => {
              handleDialogClose("close");
            }}
          />
        )}
    </Page>
  );
}
