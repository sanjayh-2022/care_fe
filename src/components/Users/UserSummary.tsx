import { useMutation } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import LanguageSelector from "@/components/Common/LanguageSelector";
import UserColumns from "@/components/Common/UserColumns";
import UserAvatar from "@/components/Users/UserAvatar";
import UserDeleteDialog from "@/components/Users/UserDeleteDialog";
import UserResetPassword from "@/components/Users/UserResetPassword";
import UserSoftwareUpdate from "@/components/Users/UserSoftwareUpdate";
import {
  BasicInfoDetails,
  ContactInfoDetails,
} from "@/components/Users/UserViewDetails";

import useAuthUser from "@/hooks/useAuthUser";

import {
  editUserPermissions,
  showAvatarEdit,
  showUserDelete,
  showUserPasswordReset,
} from "@/Utils/permissions";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import EditUserSheet from "@/pages/Organization/components/EditUserSheet";
import { UserBase } from "@/types/user/user";

export default function UserSummaryTab({ userData }: { userData?: UserBase }) {
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const authUser = useAuthUser();
  const [showEditUserSheet, setShowEditUserSheet] = useState(false);

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: mutate(routes.deleteUser, {
      pathParams: { username: userData?.username || "" },
    }),
    onSuccess: () => {
      toast.success(t("user_deleted_successfully"));
      setShowDeleteDialog(false);
      navigate("/users");
    },
    onError: () => {
      setShowDeleteDialog(false);
      toast.error(t("user_delete_error"));
    },
  });
  if (!userData) {
    return <></>;
  }

  const handleSubmit = async () => {
    deleteUser();
  };

  const userColumnsData = {
    userData,
    username: userData.username,
  };
  const deletePermitted = showUserDelete(authUser, userData);
  const passwordResetPermitted = showUserPasswordReset(authUser, userData);
  const avatarPermitted = showAvatarEdit(authUser, userData);
  const editPermissions = editUserPermissions(authUser, userData);

  const renderBasicInformation = () => {
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white">
        <BasicInfoDetails user={userData} />
      </div>
    );
  };

  const renderContactInformation = () => {
    return (
      <div className="overflow-visible px-4 py-5 sm:px-6 rounded-lg shadow sm:rounded-lg bg-white">
        <ContactInfoDetails user={userData} />
      </div>
    );
  };

  return (
    <>
      {showDeleteDialog && (
        <UserDeleteDialog
          show={showDeleteDialog}
          name={userData.username}
          handleOk={handleSubmit}
          handleCancel={() => {
            setShowDeleteDialog(false);
          }}
        />
      )}

      <EditUserSheet
        existingUsername={userData.username}
        open={showEditUserSheet}
        setOpen={setShowEditUserSheet}
      />
      <div className="mt-10 flex flex-col gap-y-6">
        {editPermissions && (
          <Button
            variant="outline"
            className="w-fit self-end"
            data-cy="edit-user-button"
            onClick={() => setShowEditUserSheet(true)}
          >
            <CareIcon icon="l-pen" className="mr-2 h-4 w-4" />
            {t("edit_user")}
          </Button>
        )}
        {avatarPermitted && (
          <UserColumns
            heading={t("edit_avatar")}
            note={
              authUser.username === userData.username
                ? t("edit_avatar_note_self")
                : t("edit_avatar_note")
            }
            Child={UserAvatar}
            childProps={userColumnsData}
          />
        )}
        <UserColumns
          heading={t("personal_information")}
          note={
            authUser.username === userData.username
              ? t("personal_information_note_self")
              : editPermissions
                ? t("personal_information_note")
                : t("personal_information_note_view")
          }
          Child={renderBasicInformation}
          childProps={userColumnsData}
        />
        <UserColumns
          heading={t("contact_info")}
          note={
            authUser.username === userData.username
              ? t("contact_info_note_self")
              : editPermissions
                ? t("contact_info_note")
                : t("contact_info_note_view")
          }
          Child={renderContactInformation}
          childProps={userColumnsData}
        />
        {passwordResetPermitted && (
          <UserColumns
            heading={t("reset_password")}
            note={t("reset_password_note_self")}
            Child={UserResetPassword}
            childProps={userColumnsData}
          />
        )}
        {authUser.username === userData.username && (
          <>
            <UserColumns
              heading={t("language_selection")}
              note={t("set_your_local_language")}
              Child={LanguageSelector}
              childProps={userColumnsData}
            />
            <UserColumns
              heading={t("software_update")}
              note={t("check_for_available_update")}
              Child={UserSoftwareUpdate}
              childProps={userColumnsData}
            />
          </>
        )}
        {deletePermitted && (
          <div className="mt-3 flex flex-col items-center gap-5 border-t-2 pt-5 sm:flex-row">
            <div className="sm:w-1/4">
              <div className="my-1 text-sm leading-5">
                <p className="mb-2 font-semibold">{t("delete_account")}</p>
                <p className="text-secondary-600">{t("delete_account_note")}</p>
              </div>
            </div>
            <div className="w-3/4">
              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="destructive"
                data-testid="user-delete-button"
                className="my-1 inline-flex"
                disabled={isDeleting}
              >
                <CareIcon icon="l-trash" className="h-4" />
                <span className="">{t("delete_account_btn")}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
