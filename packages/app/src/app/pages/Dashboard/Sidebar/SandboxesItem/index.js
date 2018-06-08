import React from 'react';
import { Route } from 'react-router-dom';
import { DropTarget } from 'react-dnd';
import AddFolderIcon from 'react-icons/lib/md/create-new-folder';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router';

import { Query } from 'react-apollo';
import InfoIcon from 'app/pages/Sandbox/Editor/Navigation/InfoIcon';
import DelayedAnimation from 'app/components/DelayedAnimation';

import Item from '../Item';

import { Container } from './elements';
import FolderEntry from './FolderEntry';
import CreateFolderEntry from './FolderEntry/CreateFolderEntry';

import { entryTarget, collectTarget } from './folder-drop-target';

import getDirectChildren from './utils/get-direct-children';

import { PATHED_SANDBOXES_FOLDER_QUERY } from '../../queries';

// eslint-disable-next-line react/prefer-stateless-function
class SandboxesItem extends React.Component {
  state = {
    creatingDirectory: false,
  };

  defaultProps = {
    path: '/',
  };

  render() {
    const { isOver, canDrop, connectDropTarget } = this.props;

    return connectDropTarget(
      <div>
        <Item
          path={'/dashboard/sandboxes'}
          Icon={InfoIcon}
          name="My Sandboxes"
          style={
            isOver && canDrop ? { backgroundColor: 'rgba(0, 0, 0, 0.3)' } : {}
          }
          contextItems={[
            {
              title: 'Create Folder',
              icon: AddFolderIcon,
              action: () => {
                this.setState({ creatingDirectory: true, open: true });
                return true;
              },
            },
          ]}
        >
          {() => (
            <Query query={PATHED_SANDBOXES_FOLDER_QUERY}>
              {({ data, loading, error }) => {
                if (loading) {
                  return (
                    <DelayedAnimation
                      style={{
                        margin: '1rem',
                        fontWeight: 600,
                        color: 'rgba(255, 255, 255, 0.6)',
                      }}
                      delay={0.6}
                    >
                      Loading...
                    </DelayedAnimation>
                  );
                }

                if (error) {
                  return <div>Error!</div>;
                }

                const folders = data.me.collections;
                const foldersByPath = {};

                folders.forEach(collection => {
                  foldersByPath[collection.path] = collection;
                });
                const children = getDirectChildren('/', folders);

                return (
                  <Container>
                    {Array.from(children)
                      .sort()
                      .map(name => {
                        const path = '/' + name;
                        return (
                          <Route
                            key={path}
                            path={`/dashboard/sandboxes${path}`}
                          >
                            {({ match: childMatch }) => (
                              <FolderEntry
                                id={foldersByPath[path].id}
                                path={path}
                                folders={folders}
                                foldersByPath={foldersByPath}
                                name={name}
                                open={!!childMatch}
                              />
                            )}
                          </Route>
                        );
                      })}
                    {(this.state.creatingDirectory || children.size === 0) && (
                      <CreateFolderEntry
                        noFocus={!this.state.creatingDirectory}
                        basePath=""
                        close={() => {
                          this.setState({ creatingDirectory: false });
                        }}
                      />
                    )}
                  </Container>
                );
              }}
            </Query>
          )}
        </Item>
      </div>
    );
  }
}

export default inject('store', 'signals')(
  DropTarget(['SANDBOX', 'FOLDER'], entryTarget, collectTarget)(
    withRouter(observer(SandboxesItem))
  )
);
