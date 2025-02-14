import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";
import { z } from "zod";

import SectionNavigator from "@/CAREUI/misc/SectionNavigator";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import DateField from "@/components/ui/date-field";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
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
import { GENDERS } from "@/common/constants";
import countryList from "@/common/static/countries.json";

import { PLUGIN_Component } from "@/PluginEngine";
import dayjs from "@/Utils/dayjs";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import validators from "@/Utils/validators";
import GovtOrganizationSelector from "@/pages/Organization/components/GovtOrganizationSelector";
import { PatientModel } from "@/types/emr/patient";
import { Organization } from "@/types/organization/organization";

interface PatientRegistrationPageProps {
  facilityId?: string;
  patientId?: string;
}

export const BLOOD_GROUPS = BLOOD_GROUP_CHOICES.map((bg) => bg.id) as [
  (typeof BLOOD_GROUP_CHOICES)[number]["id"],
];

export default function PatientRegistration(
  props: PatientRegistrationPageProps,
) {
  const [{ phone_number }] = useQueryParams();
  const { patientId, facilityId } = props;
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [suppressDuplicateWarning, setSuppressDuplicateWarning] =
    useState(!!patientId);
  const [selectedLevels, setSelectedLevels] = useState<Organization[]>([]);

  const formSchema = useMemo(
    () =>
      z
        .object({
          name: z.string().nonempty(t("name_is_required")),
          phone_number: validators().phoneNumber.required,
          same_phone_number: z.boolean(),
          emergency_phone_number: validators().phoneNumber.required,
          gender: z.enum(GENDERS, { required_error: t("gender_is_required") }),
          blood_group: z.enum(BLOOD_GROUPS, {
            required_error: t("blood_group_is_required"),
          }),
          age_or_dob: z.enum(["dob", "age"]),
          date_of_birth: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, t("date_of_birth_format"))
            .refine((date) => {
              const parsedDate = dayjs(date);
              return parsedDate.isValid() && !parsedDate.isAfter(dayjs());
            }, t("enter_valid_dob"))
            .optional(),
          age: z
            .number()
            .int()
            .positive()
            .min(1, t("age_must_be_positive"))
            .max(120, t("age_must_be_below_120"))
            .optional(),
          address: z.string().nonempty(t("address_is_required")),
          same_address: z.boolean(),
          permanent_address: z.string().nonempty(t("field_required")),
          pincode: z
            .number()
            .int()
            .positive()
            .min(100000, t("pincode_must_be_6_digits"))
            .max(999999, t("pincode_must_be_6_digits")),
          nationality: z.string().nonempty(t("nationality_is_required")),
          geo_organization: z
            .string()
            .uuid({ message: t("geo_organization_is_required") })
            .optional(),
        })
        .refine(
          (data) => (data.age_or_dob === "dob" ? !!data.date_of_birth : true),
          {
            message: t("date_of_birth_must_be_present"),
            path: ["date_of_birth"],
          },
        )
        .refine((data) => (data.age_or_dob === "age" ? !!data.age : true), {
          message: t("age_must_be_present"),
          path: ["age"],
        })
        .refine(
          (data) =>
            data.nationality === "India" ? !!data.geo_organization : true,
          {
            message: t("geo_organization_required"),
            path: ["geo_organization"],
          },
        ),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationality: "India",
      phone_number: phone_number || "",
      emergency_phone_number: "",
      age_or_dob: "dob",
      same_phone_number: false,
      same_address: true,
    },
  });

  const { mutate: createPatient, isPending: isCreatingPatient } = useMutation({
    mutationKey: ["create_patient"],
    mutationFn: mutate(routes.addPatient),
    onSuccess: (resp: PatientModel) => {
      toast.success(t("patient_registration_success"));
      // Lets navigate the user to the verify page as the patient is not accessible to the user yet
      navigate(`/facility/${facilityId}/patients/verify`, {
        query: {
          phone_number: resp.phone_number,
          year_of_birth: resp.year_of_birth,
          partial_id: resp?.id?.slice(0, 5),
        },
      });
    },
    onError: () => {
      toast.error(t("patient_registration_error"));
    },
  });

  const {
    mutate: updatePatient,
    isPending: isUpdatingPatient,
    isSuccess: isUpdateSuccess,
  } = useMutation({
    mutationFn: mutate(routes.updatePatient, {
      pathParams: { id: patientId || "" },
    }),
    onSuccess: () => {
      toast.success(t("patient_update_success"));
      goBack();
    },
    onError: () => {
      toast.error(t("patient_update_error"));
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (patientId) {
      updatePatient({
        ...values,
        ward_old: undefined,
        age: values.age_or_dob === "age" ? values.age : undefined,
        date_of_birth:
          values.age_or_dob === "dob" ? values.date_of_birth : undefined,
      });
      return;
    }

    if (facilityId) {
      createPatient({
        ...values,
        facility: facilityId,
        ward_old: undefined,
      });
    }
  }

  const sidebarItems = [
    { label: t("patient__general-info"), id: "general-info" },
  ];

  const title = !patientId
    ? t("add_details_of_patient")
    : t("update_patient_details");

  const handleDialogClose = (action: string) => {
    if (action === "transfer") {
      navigate(`/facility/${facilityId}/patients`, {
        query: {
          phone_number: form.getValues("phone_number"),
        },
      });
    } else {
      setSuppressDuplicateWarning(true);
    }
  };

  const phoneNumber = form.watch("phone_number");

  const patientPhoneSearch = useQuery({
    queryKey: ["patients", "phone-number", phoneNumber],
    queryFn: query.debounced(routes.searchPatient, {
      body: {
        phone_number: phoneNumber,
      },
    }),
    enabled: isValidPhoneNumber(phoneNumber),
  });

  const duplicatePatients = useMemo(() => {
    return patientPhoneSearch.data?.results.filter((p) => p.id !== patientId);
  }, [patientPhoneSearch.data, patientId]);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.getPatient, {
      pathParams: { id: patientId || "" },
    }),
    enabled: !!patientId,
  });

  useEffect(() => {
    if (patientQuery.data) {
      setSelectedLevels([
        patientQuery.data.geo_organization as unknown as Organization,
      ]);
      form.reset({
        ...patientQuery.data,
        same_phone_number:
          patientQuery.data.phone_number ===
          patientQuery.data.emergency_phone_number,
        same_address:
          patientQuery.data.address === patientQuery.data.permanent_address,
        age_or_dob: patientQuery.data.date_of_birth ? "dob" : "age",
        age:
          !patientQuery.data.date_of_birth && patientQuery.data.year_of_birth
            ? new Date().getFullYear() - patientQuery.data.year_of_birth
            : undefined,
        date_of_birth: patientQuery.data.date_of_birth
          ? patientQuery.data.date_of_birth
          : undefined,
        geo_organization: (
          patientQuery.data.geo_organization as unknown as Organization
        )?.id,
      } as unknown as z.infer<typeof formSchema>);
    }
  }, [patientQuery.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const showDuplicate =
    !patientPhoneSearch.isLoading &&
    !!duplicatePatients?.length &&
    !!isValidPhoneNumber(phoneNumber) &&
    !suppressDuplicateWarning;

  // TODO: Use useBlocker hook after switching to tanstack router
  // https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#how-do-i-use-navigation-blocking
  useNavigationPrompt(
    form.formState.isDirty &&
      !isCreatingPatient &&
      !(isUpdatingPatient || isUpdateSuccess) &&
      !showDuplicate,
    t("unsaved_changes"),
  );

  if (patientId && patientQuery.isLoading) {
    return <Loading />;
  }

  return (
    <Page title={title}>
      <hr className="mt-4" />
      <div className="relative mt-4 flex flex-col md:flex-row gap-4">
        <SectionNavigator sections={sidebarItems} className="hidden md:flex" />

        <Form {...form}>
          <form
            className="md:w-[500px] space-y-10"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <PLUGIN_Component
              __name="PatientRegistrationForm"
              form={form}
              patientId={patientId}
            />

            <div id="general-info" className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">
                  {t("patient__general-info")}
                </h2>
                <div className="text-sm">{t("general_info_detail")}</div>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("name")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("type_patient_name")}
                        {...field}
                        data-cy="patient-name-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("phone_number")}</FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        onChange={(value) => {
                          form.setValue("phone_number", value);
                          if (form.watch("same_phone_number")) {
                            form.setValue("emergency_phone_number", value);
                          }
                        }}
                        data-cy="patient-phone-input"
                      />
                    </FormControl>
                    <FormDescription>
                      <FormField
                        control={form.control}
                        name="same_phone_number"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(v) => {
                                  field.onChange(v);
                                  if (v) {
                                    form.setValue(
                                      "emergency_phone_number",
                                      form.watch("phone_number"),
                                    );
                                  }
                                }}
                                data-cy="same-phone-number-checkbox"
                                className="mt-2"
                              />
                            </FormControl>
                            <FormLabel>
                              {t("use_phone_number_for_emergency")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_phone_number"
                disabled={form.watch("same_phone_number")}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>
                      {t("emergency_phone_number")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        {...field}
                        data-cy="patient-emergency-phone-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel required>{t("sex")}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        {...field}
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-5 flex-wrap"
                      >
                        {GENDER_TYPES.map((g) => (
                          <FormItem
                            key={g.id}
                            className="flex items-center space-x-2 space-y-0"
                          >
                            <FormControl>
                              <RadioGroupItem
                                value={g.id}
                                data-cy={`gender-radio-${g.id.toLowerCase()}`}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {t(`GENDER__${g.id}`)}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("blood_group")}</FormLabel>
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-cy="blood-group-select">
                          <SelectValue
                            placeholder={t("please_select_blood_group")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BLOOD_GROUP_CHOICES.map((bg) => (
                          <SelectItem key={bg.id} value={bg.id}>
                            {bg.text}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Tabs
                value={form.watch("age_or_dob")}
                onValueChange={(v) => {
                  form.setValue("age_or_dob", v as "dob" | "age");
                  if (v === "age") {
                    form.setValue("date_of_birth", undefined);
                  } else {
                    form.setValue("age", undefined);
                  }
                }}
              >
                <TabsList className="mb-2" defaultValue="dob">
                  <TabsTrigger value="dob" data-cy="dob-tab">
                    {t("date_of_birth")}
                  </TabsTrigger>
                  <TabsTrigger value="age" data-cy="age-tab">
                    {t("age")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="dob">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <DateField
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onChange={(date) =>
                              field.onChange(dateQueryString(date))
                            }
                            id="dob"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="age">
                  <div className="bg-yellow-500/10 border border-yellow-500 rounded-md p-4 text-sm text-yellow-800 mb-4">
                    {t("age_input_warning")}
                    <br />
                    <b>{t("age_input_warning_bold")}</b>
                  </div>

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("age")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder={t("age")}
                            min={1}
                            max={120}
                            {...field}
                            onChange={(e) =>
                              form.setValue(
                                "age",
                                e.target.value
                                  ? Number(e.target.value)
                                  : (null as unknown as number),
                              )
                            }
                            data-cy="age-input"
                          />
                        </FormControl>

                        <FormMessage />
                        {form.getValues("age") && (
                          <div className="text-sm font-bold">
                            {Number(form.getValues("age")) <= 0 ? (
                              <span className="text-red-600">Invalid age</span>
                            ) : (
                              <span className="text-violet-600">
                                {t("year_of_birth")}:{" "}
                                {new Date().getFullYear() -
                                  Number(form.getValues("age"))}
                              </span>
                            )}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("current_address")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        onChange={(e) => {
                          form.setValue("address", e.target.value);
                          if (form.watch("same_address")) {
                            form.setValue("permanent_address", e.target.value);
                          }
                        }}
                        data-cy="current-address-input"
                      />
                    </FormControl>
                    <FormDescription>
                      <FormField
                        control={form.control}
                        name="same_address"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(v) => {
                                  field.onChange(v);
                                  if (v) {
                                    form.setValue(
                                      "permanent_address",
                                      form.watch("address"),
                                    );
                                  }
                                }}
                                data-cy="same-address-checkbox"
                              />
                            </FormControl>
                            <FormLabel>
                              {t("use_address_as_permanent")}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permanent_address"
                disabled={form.watch("same_address")}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("permanent_address")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-cy="permanent-address-input" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("pincode")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          form.setValue(
                            "pincode",
                            e.target.value
                              ? Number(e.target.value)
                              : (undefined as unknown as number), // intentionally setting to undefined, when the value is empty to avoid 0 in the input field
                          )
                        }
                        data-cy="pincode-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="nationality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>{t("nationality")}</FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={countryList.map((c) => ({
                            label: c,
                            value: c,
                          }))}
                          {...field}
                          onChange={(value) =>
                            form.setValue("nationality", value)
                          }
                          data-cy="nationality-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.watch("nationality") === "India" && (
                  <FormField
                    control={form.control}
                    name="geo_organization"
                    render={({ field }) => (
                      <FormItem className="contents">
                        <FormControl>
                          <GovtOrganizationSelector
                            {...field}
                            required={true}
                            selected={selectedLevels}
                            value={form.watch("geo_organization")}
                            onChange={(value) =>
                              form.setValue("geo_organization", value)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant={"secondary"}
                type="button"
                onClick={() => goBack()}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isCreatingPatient || isUpdatingPatient}
              >
                {patientId ? t("save") : t("save_and_continue")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
      {showDuplicate && (
        <DuplicatePatientDialog
          open={showDuplicate}
          patientList={duplicatePatients}
          handleOk={handleDialogClose}
          onOpenChange={(open) => {
            if (!open) {
              handleDialogClose("close");
            }
          }}
        />
      )}
    </Page>
  );
}
