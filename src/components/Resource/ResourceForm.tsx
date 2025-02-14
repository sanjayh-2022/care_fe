import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, navigate, useQueryParams } from "raviger";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription } from "@/components/ui/alert";
import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import UserSelector from "@/components/Common/UserSelector";

import useAppHistory from "@/hooks/useAppHistory";
import useAuthUser from "@/hooks/useAuthUser";

import { RESOURCE_STATUS_CHOICES } from "@/common/constants";
import { RESOURCE_CATEGORY_CHOICES } from "@/common/constants";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import validators from "@/Utils/validators";
import facilityApi from "@/types/facility/facilityApi";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";
import { UserBase } from "@/types/user/user";

interface ResourceProps {
  facilityId: number;
  id?: string;
}

export default function ResourceForm({ facilityId, id }: ResourceProps) {
  const [facilitySearch, setFacilitySearch] = useState("");
  const { goBack } = useAppHistory();
  const { t } = useTranslation();
  const [{ related_patient }] = useQueryParams();
  const [assignedToUser, setAssignedToUser] = useState<UserBase>();
  const authUser = useAuthUser();

  const resourceFormSchema = z.object({
    status: z.string().min(1, { message: t("field_required") }),
    category: z.string().min(1, { message: t("field_required") }),
    assigned_facility: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
    assigned_to: z.string().min(1, { message: t("field_required") }),
    emergency: z.enum(["true", "false"]),
    title: z.string().min(1, { message: t("field_required") }),
    reason: z.string().min(1, { message: t("field_required") }),
    referring_facility_contact_name: z
      .string()
      .min(1, { message: t("field_required") }),
    referring_facility_contact_number: validators().phoneNumber.required,
    priority: z.number().default(1),
  });

  type ResourceFormValues = z.infer<typeof resourceFormSchema>;

  const { data: patientData } = useQuery({
    queryKey: ["patient", related_patient],
    queryFn: query(routes.patient.getPatient, {
      pathParams: { id: String(related_patient) },
    }),
    enabled: !!related_patient,
  });

  const { data: resourceData } = useQuery({
    queryKey: ["resource_request", id],
    queryFn: query(routes.getResourceDetails, {
      pathParams: { id: String(id) },
    }),
    enabled: !!id,
  });

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      status: "pending",
      category: "",
      assigned_facility: null,
      assigned_to: "",
      emergency: "false" as const,
      title: "",
      reason: "",
      referring_facility_contact_name: "",
      referring_facility_contact_number: "",
      priority: 1,
    },
  });

  useEffect(() => {
    if (resourceData) {
      form.reset({
        status: resourceData.status,
        category: resourceData.category,
        assigned_facility: resourceData.assigned_facility,
        assigned_to: resourceData.assigned_to?.id,
        emergency: resourceData.emergency ? "true" : "false",
        title: resourceData.title,
        reason: resourceData.reason,
        referring_facility_contact_name:
          resourceData.referring_facility_contact_name,
        referring_facility_contact_number:
          resourceData.referring_facility_contact_number,
        priority: resourceData.priority,
      });
      if (resourceData.assigned_to) {
        setAssignedToUser(resourceData.assigned_to);
      } else {
        setAssignedToUser(undefined);
      }
    }
  }, [resourceData, form]);

  const { mutate: createResource, isPending } = useMutation({
    mutationFn: mutate(routes.createResource),
    onSuccess: (data: ResourceRequest) => {
      toast.success(t("resource_created_successfully"));
      navigate(`/facility/${facilityId}/resource/${data.id}`);
    },
  });

  const { mutate: updateResource, isPending: isUpdatePending } = useMutation({
    mutationFn: mutate(routes.updateResource, {
      pathParams: { id: String(id) },
    }),
    onSuccess: (data: ResourceRequest) => {
      toast.success(t("resource_updated_successfully"));
      navigate(`/facility/${facilityId}/resource/${data.id}`);
    },
  });

  const onSubmit = (data: ResourceFormValues) => {
    const resourcePayload = {
      status: data.status,
      category: data.category,
      origin_facility: String(facilityId),
      assigned_facility: data.assigned_facility?.id || null,
      assigned_to: assignedToUser?.id || null,
      approving_facility: null,
      emergency: data.emergency === "true",
      title: data.title,
      reason: data.reason,
      referring_facility_contact_name: data.referring_facility_contact_name,
      referring_facility_contact_number: data.referring_facility_contact_number,
      related_patient: related_patient,
      priority: data.priority,
    };

    if (id) {
      updateResource({ ...resourcePayload, id });
    } else {
      createResource(resourcePayload);
    }
  };
  const { data: facilities } = useQuery({
    queryKey: ["facilities", facilitySearch],
    queryFn: query.debounced(facilityApi.getAllFacilities, {
      queryParams: {
        search_text: facilitySearch,
        limit: 50,
      },
    }),
  });

  const facilityOptions = facilities?.results.map((facility) => ({
    label: facility.name,
    value: facility.id,
  }));

  const handleUserChange = (user: UserBase) => {
    form.setValue("assigned_to", user.id);
    setAssignedToUser(user);
  };

  const fillMyDetails = () => {
    form.setValue(
      "referring_facility_contact_name",
      `${authUser.first_name} ${authUser.last_name}`.trim(),
    );
    if (authUser.phone_number) {
      form.setValue("referring_facility_contact_number", authUser.phone_number);
    }
  };

  if (isPending || isUpdatePending) {
    return <Loading />;
  }

  return (
    <Page
      title={id ? t("update_resource_request") : t("create_resource_request")}
    >
      <div className="container mx-auto max-w-4xl">
        <Card>
          <CardContent className="mt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {patientData && (
                  <Alert>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/facility/${facilityId}/patient/${related_patient}/resource_requests`}
                        className="flex items-center gap-2"
                      >
                        <CareIcon
                          icon="l-user"
                          className="h-5 w-5 text-blue-700"
                        />
                        <AlertDescription className="text-sm text-blue-700">
                          {t("linked_patient")}:{" "}
                          <span className="font-medium">
                            {patientData.name}
                          </span>
                        </AlertDescription>
                      </Link>
                    </div>
                  </Alert>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">
                      {t("basic_information")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("resource_request_basic_info_description")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="assigned_facility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("facility_for_care_support")}
                          </FormLabel>
                          <FormControl>
                            <Autocomplete
                              options={facilityOptions ?? []}
                              value={field.value?.id ?? ""}
                              placeholder={t("start_typing_to_search")}
                              onSearch={setFacilitySearch}
                              onChange={(value) => {
                                const facility =
                                  facilities?.results.find(
                                    (f) => f.id === value,
                                  ) ?? null;
                                form.setValue("assigned_facility", facility);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("select_facility_description")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergency"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>{t("is_this_an_emergency")}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex gap-4"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="true" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {t("yes")}
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="false" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {t("no")}
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            {t("emergency_description")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>{t("status")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t("select_status")} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RESOURCE_STATUS_CHOICES.map((option, index) => (
                                <SelectItem key={index} value={option.text}>
                                  {t(`resource_status__${option.text}`)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>{t("category")}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t("category_description")}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RESOURCE_CATEGORY_CHOICES.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
                                  {category.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assigned_to"
                      render={() => (
                        <FormItem>
                          <FormLabel required>{t("assigned_to")}</FormLabel>
                          <FormControl>
                            <UserSelector
                              selected={assignedToUser}
                              onChange={handleUserChange}
                              placeholder={t("search_users")}
                              noOptionsMessage={t("no_users_found")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Separator />

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">
                      {t("request_details")}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {t("resource_request_details_description")}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("request_title")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("request_title_placeholder")}
                            onChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("request_title_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>{t("request_reason")}</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={t("request_reason_placeholder")}
                            onChange={(value) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("request_reason_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row gap-2 lg:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">
                        {t("contact_information")}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {t("contact_information_description")}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={fillMyDetails}
                      className="shrink-0"
                    >
                      <CareIcon icon="l-user" className="mr-2 h-4 w-4" />
                      {t("fill_my_details")}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="referring_facility_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>{t("contact_person")}</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("contact_person_description")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="referring_facility_contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>{t("contact_phone")}</FormLabel>
                          <FormControl>
                            <PhoneInput
                              {...field}
                              onChange={(value) => field.onChange(value)}
                            />
                          </FormControl>
                          <FormDescription>
                            {t("contact_phone_description")}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-4 border-t bg-background pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goBack()}
                  >
                    {t("cancel")}
                  </Button>
                  <Button type="submit" variant="default" disabled={isPending}>
                    {isPending && (
                      <CareIcon
                        icon="l-spinner"
                        className="mr-2 h-4 w-4 animate-spin"
                      />
                    )}
                    {isPending ? t("submitting") : t("submit")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
