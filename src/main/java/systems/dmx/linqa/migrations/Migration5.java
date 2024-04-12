package systems.dmx.linqa.migrations;

import static systems.dmx.core.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Migration;

import java.util.logging.Logger;



/**
 * Creates topic type "Line" and transforms existing "Arrow" instances.
 * Deletes topic type "Arrow".
 * <p>
 * Part of Linqa 1.8
 * Runs ALWAYS.
 */
public class Migration5 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        // 1) create topic type "Line"
        dmx.createTopicType(
            mf.newTopicTypeModel(LINE, "Line", ENTITY)
                .addCompDef(mf.newCompDefModel(LINE, LOCKED, ONE))
        );
        // 2) transform arrows into lines
        long count = dmx.getTopicsByType(ARROW).stream().filter(topic -> {
            topic.setTypeUri(LINE);
            return true;
        }).count();
        // 3) delete topic type "Arrow"
        dmx.deleteTopicType(ARROW);
        logger.info("### Linqa Arrow->Line transformation complete\n  Arrows transformed: " + count);
    }
}
