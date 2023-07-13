package systems.dmx.linqa;

import systems.dmx.core.RelatedTopic;
import systems.dmx.core.Topic;
import systems.dmx.core.util.IdList;
import systems.dmx.deepl.Translation;

import javax.ws.rs.core.Response;

import java.util.List;



public interface LinqaService {

    List<String> getLanguageConfig();

    List<String> getAvailableLanguages();

    Response getConfigResource(String fileName, String fileType, boolean multilingual);

    /**
     * Returns the ZW shared workspaces of the current user (according to request authorization).
     *
     * @return  the workspaces as a list of RelatedTopics. Their "relating associations" are the Memberships.
     *          Note: the "Team" workspace is not included.
     */
    List<RelatedTopic> getZWWorkspaces();

    /**
     * Returns the comments of the current workspace (according to workspace cookie).
     */
    List<Topic> getDiscussion();

    List<Topic> getAllUsers();

    Topic createDocument(String docName, long fileId);

    Topic createNote(String note);

    Topic createTextblock(String textblock);

    Topic createHeading(String heading);

    Topic createComment           (String comment, IdList refTopicIds, IdList fileTopicIds);
    Topic createMonolingualComment(String comment, IdList refTopicIds, IdList fileTopicIds);

    // Note: there is no createArrow() call here. Arrows are created by a generic createTopic() call.
    // No auto-translation is involved.

    /**
     * Needed by migration 4.
     */
    Topic createViewport(long workspaceId);

    /**
     * @param       targetLang          "lang1", "lang2", or null. If null the source lang, and thus the target lang,
     *                                  is auto-detected (by the means of an extra request to the DeepL API).
     *
     * @throws      RuntimeException    if auto-detection was solicited and an unsupported language was detected.
     *                                  Supported languages are "lang1" and "lang2".
     */
    Translation translate(String text, String targetLang);

    /**
     * Updates the profile of the current user.
     */
    void updateUserProfile(String displayName, boolean showEmailAddress);

    // --- Admin ---

    /**
     * Returns all ZW shared workspaces. Note: the "Team" workspace is not included.
     */
    List<RelatedTopic> getAllZWWorkspaces();

    /**
     * Returns the ZW shared workspaces of the given user plus the "Team" workspace, if the
     * given user is a "Team" member.
     */
    List<RelatedTopic> getZWWorkspacesOfUser(String username);

    /**
     * Returns all ZW "Team" members.
     *
     * @return    list of Username topics.
     */
    List<RelatedTopic> getZWTeamMembers();

    List<RelatedTopic> bulkUpdateWorkspaceMemberships(long workspaceId, IdList addUserIds1, IdList removeUserIds1,
                                                                        IdList addUserIds2, IdList removeUserIds2);
    List<RelatedTopic> bulkUpdateUserMemberships(String username, IdList addWorkspaceIds1, IdList removeWorkspaceIds1,
                                                                  IdList addWorkspaceIds2, IdList removeWorkspaceIds2);

    Topic createZWWorkspace(String nameLang1, String nameLang2);
}
