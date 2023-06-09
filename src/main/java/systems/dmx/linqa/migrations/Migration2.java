package systems.dmx.linqa.migrations;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.core.Constants.*;
import static systems.dmx.workspaces.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.core.service.accesscontrol.SharingMode;
import systems.dmx.workspaces.WorkspacesService;



/**
 * Extends topic type "Workspace" by 2 more "Workspace Name"s (lang1+lang2).
 * Creates the "Team" workspace.
 * <p>
 * Part of Linqa 1.0
 * Runs ALWAYS.
 */
public class Migration2 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private AccessControlService acs;
    @Inject private WorkspacesService wss;

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        //
        // Extend "Workspace" type
        dmx.getTopicType(WORKSPACE)
            .addCompDefBefore(mf.newCompDefModel(LANG1, false, false, WORKSPACE, WORKSPACE_NAME, ONE), SHARING_MODE)
            .addCompDefBefore(mf.newCompDefModel(LANG2, false, false, WORKSPACE, WORKSPACE_NAME, ONE), SHARING_MODE);
        //
        // Create "Team" workspace ### FIXME: at the moment the frontend relies on a public team workspace
        // Note: language specific workspace name is set by migration 6.
        Topic team = wss.createWorkspace(TEAM_WORKSPACE_NAME, TEAM_WORKSPACE_URI, SharingMode.PUBLIC);
        acs.setWorkspaceOwner(team, ADMIN_USERNAME);
    }
}
